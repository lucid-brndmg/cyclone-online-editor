import {useEffect, useRef, useState} from "react";
import {Editor, loader} from "@monaco-editor/react";
import ErrorStorage from "@/core/utils/errorStorage";
import SemanticListener from "@/core/antlr/semanticListener";
import Config from "../../../resource/config.json";
import SemanticAnalyzer from "@/core/semanticAnalyzer";
import EditorSemanticContext from "@/core/editorSemanticContext";
import {ParseTreeWalker} from "antlr4";
import {
  cycloneCodeMD,
  formatErrorMessage,
  formatIdentifier,
  formatKindDescription, formatStateTransRelation,
  formatType
} from "@/core/utils/format";
import {cycloneFullKeywordsSet} from "@/core/specification";
import {IdentifierKind, IdentifierType} from "@/core/definitions";
import {parseCycloneSyntax} from "@/core/antlr/parse";
import {CycloneLanguageId, CycloneMonacoConfig, CycloneMonacoTokens} from "@/core/monaco/language";
import {getDefaultCompletionItems} from "@/core/monaco/completion";
import {getKeywordHoverDocument} from "@/core/resources/referenceDocs";
import {getErrorLevel} from "@/core/monaco/error";
import {pos} from "@/lib/position";
import {LoadingOverlay} from "@mantine/core";
import GraphicalBlockBuilder from "@/core/graphicalBlockBuilder";

const MonacoSetup = ({children}) => {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    loader.config({paths: {vs: "/vs"}})
    loader.init().then((monaco) => {
      setReady(true)
    })
  }, []);
  return ready
    ? children
    : <LoadingOverlay visible={true} />
}

export const CycloneCodeEditor = ({
  code,
  onCode,
  errors,
  onErrors,
  monacoOptions,
  codeOptions,
  debouncedCode,
  onCursorPosition = null,
  onMonacoReady = null,
  onEditorContext = null,
  externalCommands = {},
  ...props
}) => {
  const [monacoCtx, setMonacoCtx] = useState(null)

  const errorsRef = useRef(new ErrorStorage(Config.editor.errorStorageLimit, {
    // onError: () => onErrors(errorsRef.current.getAll()),
    onErrors: () => onErrors(errorsRef.current.getAll()),
    onClear: () => onErrors([])
  }))
  // const semanticAnalyzerRef = useRef(new SemanticAnalyzer())
  const editorSemanticContextRef = useRef(null)
  const disposersRef = useRef([])
  const codeOptionsRef = useRef(codeOptions)

  useEffect(() => {
    codeOptionsRef.current = codeOptions
  }, [codeOptions]);

  const onCodeError = e => {
    errorsRef.current.setError(e)
    // setErrorUpdated(!errorUpdated)
  }

  useEffect(() => {
    return () => {
      let disp
      while (disp = disposersRef.current.pop()) {
        disp()
      }
    }
  }, []);

  const analyzeCode = () => {
    if (!monacoCtx?.model) {
      return
    }

    // const maxLine = monacoCtx.model.getLineCount()
    const editorCtx = new EditorSemanticContext()
    const analyzer = new SemanticAnalyzer() // semanticAnalyzerRef.current
    // const graphBuilder = new GraphicalBlockBuilder()
    // const endPos = pos(maxLine, monacoCtx.model.getLineMaxColumn(maxLine))

    errorsRef.current.clear()
    editorCtx.attach(analyzer)
    // graphBuilder.attach(analyzer)
    analyzer.on("errors", (_, es) => errorsRef.current.setErrors(es))
    // analyzer.ready(endPos)

    if (debouncedCode.trim().length === 0) {
      editorSemanticContextRef.current = null
      onEditorContext && onEditorContext(null)
      return
    }
    const result = parseCycloneSyntax({
      input: debouncedCode,
      onError: onCodeError
    })

    if (result.syntaxErrorsCount === 0) {
      ParseTreeWalker.DEFAULT.walk(new SemanticListener(analyzer), result.tree)
      // console.log(graphBuilder.context)
      editorSemanticContextRef.current = editorCtx // semanticAnalyzerRef.current.getEditorSemanticContext()
      onEditorContext && onEditorContext(editorSemanticContextRef.current)
    }
  }

  useEffect(analyzeCode, [debouncedCode]);

  const prepareLanguage = () => {
    const monaco = monacoCtx.monaco

    const model = monaco.editor.createModel(code, CycloneLanguageId)
    // setMonacoModel(model)
    const newMonacoCtx = {
      ...monacoCtx,
      model
    }
    setMonacoCtx(newMonacoCtx)
    monacoCtx.editor.setModel(model)
    monacoCtx.editor.onDidChangeCursorPosition(({position}) => {
      onCursorPosition && onCursorPosition(pos(position.lineNumber, position.column))
    })
    const langs = monaco.languages.getLanguages()
    const languageExists = langs.some(({id}) => id === CycloneLanguageId)
    if (!languageExists) {
      monaco.languages.register({ id: CycloneLanguageId })
    }
    const {dispose: disposeTokenProvider} = monaco.languages.setMonarchTokensProvider(CycloneLanguageId, CycloneMonacoTokens)
    const {dispose: disposeLanguageConf} = monaco.languages.setLanguageConfiguration(CycloneLanguageId, CycloneMonacoConfig)
    const {dispose: disposeCompletionProvider} = monaco.languages.registerCompletionItemProvider(CycloneLanguageId, {
      provideCompletionItems(model, position, context, token) {
        const {startColumn, word} = model.getWordUntilPosition(position)
        const defaultItems = getDefaultCompletionItems(monaco)

        if (editorSemanticContextRef.current) {
          const found = editorSemanticContextRef.current.findAvailableIdentifiers(position.lineNumber, startColumn ?? position.column)

          if (found) {
            if (word.includes(".")) {
              const [pre] = word.split(".")
              const ident = found.value.identifiers.get(pre)
              if (ident && ident.recordChild) {
                for (let {text} of ident.recordChild) {
                  const v = `${pre}.${text}`
                  defaultItems.suggestions.push({
                    label: v,
                    insertText: v,
                    kind: monaco.languages.CompletionItemKind.Field,
                  })
                }
              }
            } else {
              for (let ident of found.value.identifiers.values()) {
                defaultItems.suggestions.push({
                  label: ident.text,
                  insertText: ident.text,
                  kind: monaco.languages.CompletionItemKind.Variable,
                })
              }

              for (let enm of found.value.enums) {
                const literal = `#${enm}`
                defaultItems.suggestions.push({
                  label: literal,
                  insertText: literal,
                  kind: monaco.languages.CompletionItemKind.Enum
                })
              }
            }
          }
        }
        return defaultItems
      }
    })

    const {dispose: disposeHoverProvider} = monaco.languages.registerHoverProvider(CycloneLanguageId, {
      async provideHover(model, position, token) {
        const word = model.getWordAtPosition(position)
        const text = word?.word
        if (!text) {
          return
        }
        const isKeyword = cycloneFullKeywordsSet.has(text)
        if (isKeyword) {
          const doc = await getKeywordHoverDocument(text)
          if (doc.length) {
            return {contents: doc.map(value => ({
                value,
                supportHtml: true,
                isTrusted: true
              }))}
          }
        } else {
          if (!editorSemanticContextRef.current) {
            return
          }
          const found = editorSemanticContextRef
            .current
            .findAvailableIdentifiers(
              position.lineNumber,
              word.startColumn ?? position.column
            )
          if (!found) {
            return
          }
          if (text.startsWith("#")) {
            if (found.value.enums.has(text.slice(1))) {
              return {
                contents: [
                  {
                    value: cycloneCodeMD(`enum ${text}`),
                  },
                  { value: formatKindDescription(IdentifierKind.EnumField) },
                ],
              }
            }
          } else if (text.includes(".")) {
            const [pre, post] = text.split(".")
            const ident = found.value.identifiers.get(pre)
            if (ident && ident.type === IdentifierType.Record) {
              const child = ident.recordChild.find(({text}) => text === post)
              if (child) {
                return {
                  contents: [
                    {
                      value: cycloneCodeMD(`${formatType(child.type)} ${pre}.${child.text}`),
                    },
                    { value: formatKindDescription(child.kind) },
                  ],
                }
              }

            }
          } else {
            const ident = found.value.identifiers.get(text)
            if (ident) {
              const contents = [{value: cycloneCodeMD(formatIdentifier(ident))}, { value: formatKindDescription(ident.kind) }]
              switch (ident.kind) {
                case IdentifierKind.Trans: {
                  const targetStates = editorSemanticContextRef.current.findTransition(ident.text)
                  if (targetStates?.size) {
                    contents.push({value: `targeted to ${targetStates.size} states: ${[...targetStates].join(", ")}`})
                  }
                  break
                }
                case IdentifierKind.State: {
                  const state = editorSemanticContextRef.current.findState(ident.text)
                  if (state) {
                    const {namedTrans, exprList, trans} = state
                    if (trans <= 0) {
                      break
                    }
                    const insightSegments = [
                      formatStateTransRelation({trans, namedTrans}).text,
                    ]
                    const exprLen = exprList.length
                    if (exprLen) {
                      const transInsightMax = 10
                      insightSegments.push(...exprList.slice(0, transInsightMax).map(expr => cycloneCodeMD(expr)))
                      if (exprLen > transInsightMax) {
                        insightSegments.push(`... ${exprLen - transInsightMax} more`)
                      }
                    }
                    contents.push({value: insightSegments.join("\n")})
                  }
                  break
                }
              }
              return {
                contents,
              }
            }
          }
        }
      }
    })

    const {dispose: disposeOnTransLensCommand} = monaco.editor.registerCommand("onTransLens", externalCommands["onTransLens"])
    const {dispose: disposeOnStateLensCommand} = monaco.editor.registerCommand("onStateLens", externalCommands["onStateLens"])

    const {dispose: disposeLensProvider} = monaco.languages.registerCodeLensProvider(CycloneLanguageId, {
      provideCodeLenses: function (model, token) {
        if (!editorSemanticContextRef.current) {
          return
        }
        const {states, trans} = editorSemanticContextRef.current.getVisualData()
        const lensesTrans = codeOptionsRef.current.lensTransEnabled ? trans
          .map(({targetStates, position}, i) => {
            const size = targetStates.size
            const allStates = [...targetStates]
            return {
              range: {
                startLineNumber: position.startPosition.line,
                startColumn: position.startPosition.column + 1,
                endLineNumber: position.stopPosition.line,
                endColumn: position.stopPosition.column + 1
              },
              id: `trans_${i}`,
              command: {
                id: "onTransLens",
                title: `${size} states targeted: ${allStates.slice(0, 5).join(", ")}${size > 5 ? " ..." : ""}`,
                tooltip: allStates.join(", "),
                arguments: [allStates]
              }
            }
          }) : []
        const lensesStates = codeOptionsRef.current.lensStateEnabled ? [...states.values()].map(({trans, namedTrans, position}, i) => {
          const {text, named} = formatStateTransRelation({trans, namedTrans}, 5)
          return {
            range: {
              startLineNumber: position.startPosition.line,
              startColumn: position.startPosition.column + 1,
              endLineNumber: position.stopPosition.line,
              endColumn: position.stopPosition.column + 1
            },
            id: `state_${i}`,
            command: {
              id: "onStateLens",
              title: text,
              tooltip: named.join(", "),
              arguments: [{trans, namedTrans}]
            }
          }
        }) : []

        return {
          lenses: lensesTrans.concat(lensesStates),
          dispose: () => {},
        };
      },
      resolveCodeLens: function (model, codeLens, token) {
        return codeLens;
      },
    })


    disposersRef.current.push(
      disposeCompletionProvider,
      disposeLanguageConf,
      disposeTokenProvider,
      disposeHoverProvider,
      disposeLensProvider,
      disposeOnTransLensCommand,
      disposeOnStateLensCommand
    )

    onMonacoReady && onMonacoReady(newMonacoCtx)
  }

  const prepareEditor = (editor, monaco) => {
    // editorRef.current = editor;
    // setMonaco(monaco)

    setMonacoCtx({
      editor,
      monaco,
      model: null
    })

    // editor.setModel()
  }

  useEffect(() => {
    if (monacoCtx == null || monacoCtx.model != null) {
      if (monacoCtx?.model != null) {
        requestAnimationFrame(analyzeCode)
      }
      return
    }
    prepareLanguage()
  }, [monacoCtx]);

  useEffect(() => {
    if (!monacoCtx?.model) {
      return
    }

    const monaco = monacoCtx.monaco

    // TODO: filter kinds?
    const errorsConverted = errors.map(({type, params, startPosition, stopPosition, source}) => {
      const startLine = startPosition.line
      const stopLine = stopPosition?.line ?? startPosition.line
      const startColumn = startPosition.column
      const stopColumn = stopPosition?.column ?? startPosition.column

      // const noPosition = (stopColumn === startColumn && startLine === stopLine)
      // const startColumn = startPosition.column + (noPosition ? 1 : 0)
      // const stopColumn = (stopPosition ? stopPosition.column : startColumn) + 1

      return {
        message: formatErrorMessage(type, params, source),
        severity: getErrorLevel(monaco, type), // monaco.MarkerSeverity.Error,
        startLineNumber: startLine,
        endLineNumber: stopLine,
        startColumn: startColumn + 1,
        endColumn: stopColumn + 1
      }
    })

    // console.log(errorsConverted)

    monaco.editor.setModelMarkers(monacoCtx.model, "owner", errorsConverted)
  }, [errors])

  return (
    <MonacoSetup>
      <Editor
        defaultLanguage={CycloneLanguageId}
        value={code}
        onChange={(v) => {
          onCode(v)
        }}
        options={monacoOptions}
        onMount={prepareEditor}
        {...props}
      />
    </MonacoSetup>
  );
}