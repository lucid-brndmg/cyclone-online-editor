import {useEffect, useRef, useState} from "react";
import {Editor, loader} from "@monaco-editor/react";
import EditorSemanticContext from "@/core/editorSemanticContext";
import cycloneAnalyzer from "cyclone-analyzer";
import {
  cycloneCodeMD,
  formatErrorMessage,
  formatIdentifier,
  formatKindDescription, formatStateTransRelation,
} from "@/core/utils/format";
import {cycloneFullKeywordsSet} from "@/core/specification";
import {CycloneLanguageId, CycloneMonacoConfig, CycloneMonacoTokens} from "@/core/monaco/language";
import {getDefaultCompletionItems} from "@/core/monaco/completion";
import {getKeywordHoverDocument} from "@/core/resources/referenceDocs";
import {getErrorLevel} from "@/core/monaco/error";
import {pos, posRangeIncludes, posStopBefore} from "@/lib/position";
import {LoadingOverlay} from "@mantine/core";
import {ErrorSource, ExtendedErrorType} from "@/core/definitions";
import {PublicUrl} from "@/core/utils/resource";

const {IdentifierKind, IdentifierType} = cycloneAnalyzer.language.definitions
const {typeToString} = cycloneAnalyzer.utils.type

const MonacoSetup = ({children, ready, onReady}) => {
  // const [ready, setReady] = useState(false)
  useEffect(() => {
    loader.config({paths: {vs: PublicUrl.MonacoScripts}})
    loader.init().then((monaco) => {
      onReady(true)
    })
  }, []);
  return ready
    ? children
    : <LoadingOverlay visible={true} />
}

const findClosestValue = (line, column, xs) => xs?.findLast(v => {
  const {startPosition} = v.position
  return line > startPosition.line || (line === startPosition.line && column >= startPosition.column)
})

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
  buildSyntaxBlockTree = false,
  enableCDN = true,
  onAnalyzerError,
  ready,
  onReady,
  customCodeSnippets,
  ...props
}) => {
  const monacoCtxRef = useRef()

  // const errorsRef = useRef(new ErrorStorage(Config.editor.errorStorageLimit, {
  //   onErrors: () => onErrors(errorsRef.current.getAll()),
  //   onClear: () => onErrors([])
  // }))
  // const semanticAnalyzerRef = useRef(new SemanticAnalyzer())
  const editorSemanticContextRef = useRef(null)
  const disposersRef = useRef([])
  const codeOptionsRef = useRef(codeOptions)
  const codeSnippetRef = useRef(customCodeSnippets)

  // console.log(customCodeSnippets)

  useEffect(() => {
    codeOptionsRef.current = codeOptions
  }, [codeOptions]);
  useEffect(() => {
    codeSnippetRef.current = customCodeSnippets ?? []
  }, [customCodeSnippets]);

  useEffect(() => {
    return () => {
      let disp
      while (disp = disposersRef.current.pop()) {
        disp()
      }
    }
  }, []);

  const analyzeCode = () => {
    if (!monacoCtxRef.current) {
      return
    }

    onAnalyzerError && onAnalyzerError(null, false)
    let errors = []

    // errorsRef.current.clear()
    if (debouncedCode.trim().length === 0) {
      editorSemanticContextRef.current = null
      onEditorContext && onEditorContext(null)
      onErrors(errors)
      return
    }
    const editorCtx = new EditorSemanticContext(buildSyntaxBlockTree)
    try {
      const result = cycloneAnalyzer.analyzer.analyzeCycloneSpec(debouncedCode, {
        analyzerExtensions: [editorCtx]
      })
      if (result.hasSyntaxError()) {
        for (let {line, column, msg} of result.lexerErrors) {
          errors.push({
            source: ErrorSource.Lexer,
            startPosition: pos(line, column),
            type: ExtendedErrorType.SyntaxError,
            params: {msg}
          })
        }
        for (let {line, column, msg} of result.parserErrors) {
          errors.push({
            source: ErrorSource.Parser,
            startPosition: pos(line, column),
            type: ExtendedErrorType.SyntaxError,
            params: {msg}
          })
        }
      } else {
        if (result.semanticErrors.length) {
          errors = result.semanticErrors.map(e => ({...e, source: ErrorSource.Semantic}))
        }

        // console.log(graphBuilder.context)
        editorSemanticContextRef.current = editorCtx // semanticAnalyzerRef.current.getEditorSemanticContext()
        onEditorContext && onEditorContext(editorSemanticContextRef.current)
      }
    } catch (e) {
      console.log("An error occurred when analyzing:", e)
      onAnalyzerError && onAnalyzerError(e, true)
    }

    onErrors(errors)
  }

  useEffect(analyzeCode, [debouncedCode]);

  const prepareLanguage = () => {
    const monacoCtx = monacoCtxRef.current
    const monaco = monacoCtx.monaco
    const model = monaco.editor.getModels()[0] // monaco.editor.createModel(code, CycloneLanguageId)
    monacoCtx.model = model
    // setMonacoModel(model)
    // const newMonacoCtx = {
    //   ...monacoCtx,
    //   model
    // }
    // setMonacoCtx(newMonacoCtx)
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
        const additionalCompletion = codeSnippetRef.current.map(({label, insertText}) => ({
          label, insertText,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        }))

        const defaultItems = getDefaultCompletionItems(monaco, additionalCompletion)

        if (editorSemanticContextRef.current) {
          const line = position.lineNumber, column = startColumn ?? position.column
          const found = editorSemanticContextRef.current.findAvailableIdentifiers(line, column)

          if (found) {
            if (word.includes(".")) {
              const [pre] = word.split(".")
              const identStack = found.value.identifiers.get(pre)
              const rec = identStack?.findLast(it => it.kind === IdentifierKind.Record && posStopBefore({line, column}, it.position.stopPosition))?.recordChild
              if (rec) {
                for (let {text} of rec) {
                  const v = `${pre}.${text}`
                  defaultItems.suggestions.push({
                    label: v,
                    insertText: v,
                    kind: monaco.languages.CompletionItemKind.Field,
                  })
                }
              }
            } else {
              for (let identKey of found.value.identifiers.keys()) {
                defaultItems.suggestions.push({
                  label: identKey,
                  insertText: identKey,
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
          const line = position.lineNumber
          const column = word.startColumn ?? position.column
          const found = editorSemanticContextRef
            .current
            .findAvailableIdentifiers(
              line, column
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
            const identStack = found.value.identifiers.get(pre)
            const ident = identStack?.findLast(it => {
              const {position, type} = it
              const {stopPosition} = position
              return type === IdentifierType.Record && posStopBefore({line, column}, stopPosition)
            })
            if (ident) {
              const child = ident.recordChild.find(({text}) => text === post)
              if (child) {
                return {
                  contents: [
                    {
                      value: cycloneCodeMD(`${typeToString(child.type, child.typeParams)} ${pre}.${child.text}`),
                    },
                    { value: formatKindDescription(child.kind) },
                  ],
                }
              }

            }
          } else {
            const identStack = found.value.identifiers.get(text)
            const ident = findClosestValue(line, column, identStack)
            if (ident) {
              const contents = [{value: cycloneCodeMD(formatIdentifier(ident))}, { value: formatKindDescription(ident.kind) }]
              switch (ident.kind) {
                case IdentifierKind.Trans: {
                  const targetStates = editorSemanticContextRef.current.findTransition(ident.text)
                  if (targetStates?.size) {
                    contents.push({value: `connected to ${targetStates.size} nodes: ${[...targetStates].join(", ")}`})
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
                title: `connected to ${size} nodes: ${allStates.slice(0, 5).join(", ")}${size > 5 ? " ..." : ""}`,
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

    onMonacoReady && onMonacoReady(monacoCtxRef.current)
  }

  const prepareEditor = (editor, monaco) => {
    // editorRef.current = editor;
    // setMonaco(monaco)

    // setMonacoCtx({
    //   editor,
    //   monaco,
    //   model: null
    // })

    monacoCtxRef.current = {
      editor,
      monaco,
      model: null
    }

    setTimeout(analyzeCode, 0)
    prepareLanguage()

    if (enableCDN) {
      onReady(true)
    }

    // editor.setModel()
  }

  // useEffect(() => {
  //   if (monacoCtxRef.current == null || monacoCtxRef.current.model != null) {
  //     if (monacoCtxRef.current?.model != null) {
  //       setTimeout(analyzeCode, 0)
  //     }
  //     return
  //   }
  //   prepareLanguage()
  // }, []);

  useEffect(() => {
    if (!monacoCtxRef.current) {
      return
    }

    const monacoCtx = monacoCtxRef.current

    const monaco = monacoCtx.monaco

    // TODO: filter kinds?
    const errorsConverted = errors.map(({type, params, startPosition, stopPosition, source}) => {
      const startLine = startPosition.line
      const stopLine = stopPosition?.line ?? startPosition.line
      const startColumn = startPosition.column
      const stopColumn = stopPosition?.column ?? startPosition.column

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

  const editor = <Editor
    defaultLanguage={CycloneLanguageId}
    value={code}
    onChange={onCode}
    options={monacoOptions}
    onMount={prepareEditor}
    {...props}
  />

  return enableCDN
    ? editor
    : (
      <MonacoSetup ready={ready} onReady={onReady}>
        {editor}
      </MonacoSetup>
    );
}