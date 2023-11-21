import {
  ActionKind,
  ErrorKind,
  ErrorSource,
  IdentifierKind,
  IdentifierType,
  OutlineKind,
  SemanticContextType
} from "@/core/definitions";
import {CategorizedStackTable, PositionTable, StackedTable} from "@/lib/storage";
import {pos, posPair} from "@/lib/position";
import {
  builtinActions,
  declarationContextType,
  declarationContextTypeToIdentifierKind,
  identifierKindToType,
  identifierNoPushTypeStackBlocks,
  optionAcceptableValues,
  scopedContextType,
  scopeSupportsShadowing,
  typeTokenToType
} from "@/core/specification";
import {declareMetadata, recordBlockerFinder, scopeMetadata} from "@/core/utils/semantic";
import {popMulti, popMultiStore} from "@/lib/list";
import {checkSignature} from "@/core/utils/types";

import {formatSignatureInputs, formatType, formatTypes} from "@/core/utils/format";

export class EditorSemanticContext {
  scopePosition = new PositionTable()
  scopeLayers = []
  stateTable = new Map()
  transitions = []

  // identifierCoordsTable = new FixedCoordinateTable()

  findAvailableIdentifiers(line, col, filter = null) {
    return this.scopePosition.find(line, col, filter)
  }

  setSortIdentifier(pos, value) {
    this.scopePosition.set(pos, value)
    this.scopePosition.sort()
  }

  pushScopeLayerScope(layer, type, position) {
    this.scopeLayers.push({layer, outlineKind: OutlineKind.Scope, type, position})
  }

  pushScopeLayerIdent(text, type, position, kind, blockType, currentLayer) {
    this.scopeLayers.push({text, type, position, kind, blockType, outlineKind: OutlineKind.Identifier, currentLayer})
  }

  getScopeLayers() {
    return this.scopeLayers
  }

  defineState(identifier, attrs) {
    this.stateTable.set(identifier, {
      identifier,
      attrs,
    })
  }

  getDefinedStates() {
    return this.stateTable
  }

  // operator: -> | <-> | * | +
  defineTransition(identifier, label, whereExpr, fromState, toStates, operators, excludedStates) {
    this.transitions.push({
      identifier,
      label,
      whereExpr,
      fromState,
      toStates,
      operators,
      excludedStates
    })
  }
  getDefinedTransitions() {
    return this.transitions
  }
}

export class SemanticAnalyzer {
  context = {
    // identifierTable: new Map(),
    // Map<Type, Map<String, Int>>
    // identifierCounts: new CategorizedCountTable(),
    // recordCounts: new CategorizedCountTable(),
    recordFieldStack: new CategorizedStackTable(),
    identifierStack: new StackedTable(),
    // {type, col, line}
    blockContextStack: [],
    currentRecordIdent: [],
    scopedBlocks: [],
    actionTable: new CategorizedStackTable(builtinActions),
    typeStack: [],
    // scopePosition: new PositionTable(),
    definedOptions: new Set(),
    enumFields: new Set(),

    startNodeIdentifier: null,
    goalDefined: false,

    // scopeCoords: [0, 0],
    // identifierCoordsTable: new FixedCoordinateTable(),

    editorCtx: new EditorSemanticContext(),
    errorStorage: null
    // lastScopeLayer: 0,
  }

  init(errorStorage, maxLine, maxCol) {
    this.context = {
      // identifierTable: new Map(),
      // Map<Type, Map<String, Int>>
      // identifierCounts: new CategorizedCountTable(),
      // recordCounts: new CategorizedCountTable(),
      recordFieldStack: new CategorizedStackTable(),
      identifierStack: new StackedTable(),
      // {type, col, line}
      blockContextStack: [],
      currentRecordIdent: [],
      scopedBlocks: [],
      actionTable: new CategorizedStackTable(builtinActions),
      typeStack: [],
      // scopePosition: new PositionTable(),
      definedOptions: new Set(),
      enumFields: new Set(),
      startNodeIdentifier: null,
      goalDefined: false,
      // scopeCoords: [0, 0],
      // identifierCoordsTable: new FixedCoordinateTable(),

      editorCtx: new EditorSemanticContext(),
      errorStorage
      // lastScopeLayer: 0
    }

    this.pushBlock(SemanticContextType.ProgramScope, posPair(0, 0, 0, 0), pos(maxLine, maxCol))

    // console.log(this.context)
  }

  getEditorSemanticContext() {
    return this.context.editorCtx
  }

  pushBlock(type, position, metadata = null) {
    let table = null
    const isScope = scopedContextType.has(type)
    if (isScope) {
      // const [x, y] = this.context.scopeCoords
      table = scopeMetadata()
    } else if (declarationContextType.has(type)) {
      table = declareMetadata()
    }

    const blockContent = {
      type,
      position,
      // index: this.context.blockContextStack.length,
      // identifierTable: new Map(), // Map<Kind, Map<Ident, [definitions]>>
      metadata: table || metadata ? {...metadata, ...table} : null
    }

    this.context.blockContextStack.push(blockContent)
    if (isScope) {
      this.context.scopedBlocks.push(blockContent)
      this.context.editorCtx.pushScopeLayerScope(this.context.scopedBlocks.length, type, position)
    }
  }

  clearScope(block) {
    this.context.editorCtx.setSortIdentifier(block.position, {
      type: block.type,
      identifiers: this.context.identifierStack.extractLatestToMap(ident => ident.text),
      enums: new Set(this.context.enumFields)

      // TODO: store (last) values instead of names?
    })

    // this.context.editorCtx.pushScopeLayerScope(
    //   this.context.scopedBlocks.length,
    //   block.type,
    //   block.position,
    //
    // )

    if (block.metadata) {
      this.context.identifierStack.subCountTable(block.metadata?.identifierCounts)
      // this.context.identifierCounts.sub(block.metadata?.identifierCounts)
      // this.context.recordCounts.sub(block.metadata?.recordCounts)
      this.context.recordFieldStack.subCategorizedCountTable(block.metadata.recordCounts)
    } else {
      console.log("warn: no local identifier count table found")
    }
  }

  popBlock(clear = true) {
    const block = this.context.blockContextStack.pop()
    if (block && clear) {
      if (scopedContextType.has(block.type)) {
        this.clearScope(block)
        this.context.scopedBlocks.pop()
      }
      if (block.type === SemanticContextType.RecordDecl) {
        this.context.currentRecordIdent.pop()
      }
    } else if (clear) {
      console.log("warn: no block to pop")
    }
    return block
  }

  peekBlock(skip = 0) {
    return this.context.blockContextStack[this.context.blockContextStack.length - 1 - skip]
  }

  hasBlock() {
    return this.context.blockContextStack.length > 0
  }

  latestNthScope(skip = 0) {
    return this.context.scopedBlocks[this.context.scopedBlocks.length - 1 - skip]
  }

  searchNearestBlock(f, stopAtType = null, skip = 0) {
    for (let i = this.context.blockContextStack.length - 1 - skip; i >= 0; i--) {
      // if (i <= before) {
      //   return null
      // }
      const block = this.context.blockContextStack[i]
      if (f(block)) {
        return block
      }
      if (block.type === stopAtType) {
        return null
      }
    }

    return null
  }

  searchNearestScope(f) {
    for (let scope of this.context.scopedBlocks) {
      if (f(scope)) {
        return scope
      }
    }

    return null
  }

  // registerEnum(identText) {
  //   this.context.enumFields.add(identText)
  // }

  referenceEnum(identText, position) {
    this.context.typeStack.push(IdentifierType.Enum)
    if (!this.context.enumFields.has(identText)) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.UndefinedIdentifier,
        ...position,
        msg: `undefined enum literal '#${identText}'`
      })
    }
    // return null
  }

  registerIdentifier(block, identText, identPos) {
    // check duplication
    const blockType = block.type
    const scope = this.latestNthScope()
    if (!scope) {
      console.log("warn: scope not found", blockType, identText, identPos)
    }

    const identKind = declarationContextTypeToIdentifierKind[blockType]
      ?? IdentifierKind.Unknown
    let isEnum = blockType === SemanticContextType.EnumDecl
    const type = identifierKindToType[identKind]
      ?? block.metadata.type
    // console.log("support shadowing: ", scopeSupportsShadowing.get(scope.type)?.has(identKind), scope.type, identKind)
    const hasCount = !isEnum && (scope
      ? scopeSupportsShadowing.get(scope.type)?.has(identKind)
        ? scope.metadata.identifierCounts.get(identText) > 0
        : this.context.identifierStack.getLength(identText) > 0
      : this.context.identifierStack.getLength(identText) > 0)

    // this.context.identifierCounts.hasCounts(registrationCheckKinds, identText)

    if (hasCount) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.RedeclaredIdentifier,
        ...identPos,
        msg: `redeclaration of identifier: ${identText}`
      })
    }

    let fnSignature = null

    switch (blockType) {
      case SemanticContextType.RecordDecl: {
        this.context.currentRecordIdent.push(identText)
        block.metadata.identifier = identText
        break
      }
      case SemanticContextType.FnDecl: {
        this.context.actionTable.push(ActionKind.Function, identText, {
          action: identText,
          kind: ActionKind.Function,
          signatures: block.metadata.signatures
        })
        fnSignature = block.metadata.signatures[0]
        block.metadata.identifier = identText
        break
      }

      case SemanticContextType.FnParamsDecl: {
        block.metadata.currentIdentifier = identText
        break
      }

      // case SemanticContextType.LetDecl:
      case SemanticContextType.TransDecl:
      case SemanticContextType.StateDecl:
      case SemanticContextType.LocalVariableDecl:
      case SemanticContextType.GlobalConstantDecl:
      case SemanticContextType.GlobalVariableDecl:
      case SemanticContextType.RecordVariableDecl: {
        block.metadata.identifier = identText
        break
      }

      case SemanticContextType.EnumDecl: {
        this.context.enumFields.add(identText)
        break
      }
    }

    this.context.editorCtx.pushScopeLayerIdent(identText, type, identPos, identKind, blockType, this.context.scopedBlocks.length)

    if (!isEnum) {
      const info = {
        position: identPos,
        kind: identKind,
        type,
        text: identText,
        // recordIdent: null,
        recordChild: [],
        fnSignature,
        fnParams: []
      }
      const isInsideRecord = scope.type === SemanticContextType.RecordScope
        && this.searchNearestBlock(
          recordBlockerFinder,
          SemanticContextType.RecordScope,
          // this.context.blockContextStack.length - scope.index
        ) === null
      if (isInsideRecord) {
        const recordIdent = this.context.currentRecordIdent[this.context.currentRecordIdent.length - 1]
        if (recordIdent) {
          // info.recordIdent = recordIdent

          const recordInfo = this.context.identifierStack.peek(recordIdent)
          recordInfo?.recordChild?.push({
            text: identText,
            type,
            kind: identKind
          })
          // no need to check current counts here
          // cuz RecordScope is already a scope

          // scope?.metadata.recordCounts.incr(recordIdent, identText)
          const prevScope = this.latestNthScope(1)
          if (prevScope) {
            prevScope?.metadata.recordCounts.incr(recordIdent, identText)
          } else {
            console.log("warn: no previous scope exists before current scope")
          }
          // TODO: push to record scope here
          // this.context.recordCounts.incr(recordIdent, identText)
          this.context.recordFieldStack.push(recordIdent, identText, info)
          // maybe for scoped too ?
        } else {
          console.log("warn: no record context exists when defining record field: ", identText)
        }
      }

      this.context.identifierStack.push(identText, info)
      scope.metadata.identifierCounts.incr(identText)
    }

    // this.context.identifierCounts.incr(identKind, identText)
  }

  referenceIdentifier(blockType, identText, identPos) {
    // check existence

    let errMsg = `use of undefined identifier: ${identText}`
    let kindLimitations = null

    const ident = this.context.identifierStack.peek(identText)
    const shouldPushTypeStack = !identifierNoPushTypeStackBlocks.has(blockType)
    const es = []

    switch (blockType) {
      // case SemanticContextType.StateInc:
      case SemanticContextType.TransScope:
      case SemanticContextType.InExpr:
      case SemanticContextType.Stop:
      case SemanticContextType.PathPrimary: {
        kindLimitations = [IdentifierKind.State]
        errMsg = `use of undefined state: ${identText}`

        if (blockType === SemanticContextType.TransScope) {
          const transDecl = this.peekBlock(1).metadata
          if (transDecl.fromState != null) {
            if (transDecl.exclusionFlag) {
              transDecl.excludedStates.add(identText)
            } else {
              transDecl.toStates.add(identText)
            }
          } else {
            transDecl.fromState = identText
          }
        }

        break
      }

      case SemanticContextType.StateInc: {
        kindLimitations = [IdentifierKind.State, IdentifierKind.Let]
        errMsg = `use of undefined state or path: ${identText}`
        break
      }

      case SemanticContextType.With: {
        kindLimitations = [IdentifierKind.Invariant]
        errMsg = `use of undefined invariant: ${identText}`
        break
      }

      case SemanticContextType.GoalScope: {
        // must be BOOL??
        // | (identifier pathCondAssignExpr SEMI)
        if (ident && ident.type !== IdentifierType.Bool) {
          es.push({
            source: ErrorSource.Semantic,
            kind: ErrorKind.TypeError,
            ...identPos,
            msg: `type mismatch: ${identText} expected to have type ${formatType(IdentifierType.Bool)}`
          })
        }
        break
      }

      case SemanticContextType.FnCall: {
        if (ident) {
          const functionDecl = this.searchNearestBlock(b => b.type === SemanticContextType.FnDecl)
          const fnName = functionDecl?.metadata.name
          if (fnName === identText && ident.kind === IdentifierKind.FnName) {
            es.push({
              source: ErrorSource.Semantic,
              kind: ErrorKind.SemanticError,
              ...identPos,
              msg: `recursion call to function '${identText}' is not allowed`
            })
          }
        }

        break
      }
    }

    if (!ident || (kindLimitations != null && !kindLimitations.includes(ident.kind))) {
      es.push({
        source: ErrorSource.Semantic,
        kind: ErrorKind.UndefinedIdentifier,
        ...identPos,
        msg: errMsg
      })
    }

    // console.log("ref", identText, ident, shouldPushTypeStack, blockType)

    if (shouldPushTypeStack) {
      this.context.typeStack.push(ident?.type ?? IdentifierType.Unknown)
    }

    if (es.length) {
      this.context.errorStorage.setErrors(es)
    }
  }

  referenceRecordField(parentIdentText, parentPos, identText, identPos) {
    // pop the Record pushed before
    this.context.typeStack.pop()
    const scope = this.latestNthScope()
    const es = []

    if (!scope) {
      console.log("warn: scope not found when reference record field", parentIdentText, identText, identPos)
    }

    let errMsgParent = `not a valid record: ${parentIdentText}`
    let errMsgField = `use of undefined record field: ${parentIdentText}.${identText}`

    const ident = this.context.identifierStack.peek(parentIdentText)

    const hasRecord = ident && ident.kind === IdentifierKind.Record // this.context.identifierCounts.hasCounts([IdentifierKind.Record], parentIdentText)
    if (!hasRecord) {
      es.push({
        source: ErrorSource.Semantic,
        kind: ErrorKind.UndefinedIdentifier,
        ...parentPos,
        msg: errMsgParent
      })
    }

    const hasRecordField = hasRecord && this.context.recordFieldStack.getLength(parentIdentText, identText) > 0 // this.context.recordCounts.hasCounts([parentIdentText], identText)
    if (!hasRecordField) {
      es.push({
        source: ErrorSource.Semantic,
        kind: ErrorKind.UndefinedIdentifier,
        ...identPos,
        msg: errMsgField
      })
      this.context.typeStack.push(IdentifierType.Hole)
    } else {
      const recordField = this.context.recordFieldStack.peek(parentIdentText, identText)
      this.context.typeStack.push(recordField.type)
    }

    if (es.length) {
      this.context.errorStorage.setErrors(es)
    }

  }

  handleIdentifier(identifierText, identifierPos) {
    const block = this.peekBlock()
    if (!block) {
      console.log("warn: block type not found")
      return
    }

    const blockType = block.type
    if (declarationContextType.has(blockType)) {
      if (blockType === SemanticContextType.FnDecl) {
        block.metadata.name = identifierText
      }
      this.registerIdentifier(block, identifierText, identifierPos)
    } else if (blockType === SemanticContextType.DotExpr) {
      if (block.metadata.parent != null) {
        const [parentIdent, parentPos] = block.metadata.parent
        this.referenceRecordField(parentIdent, parentPos, identifierText, identifierPos)
      } else {
        block.metadata.parent = [identifierText, identifierPos]
        this.referenceIdentifier(blockType, identifierText, identifierPos)
      }
    } else {
      if (blockType === SemanticContextType.FnCall && block.metadata.fnName === null) {
        block.metadata.fnName = identifierText
      }

      // console.log("warn: unhandled block with identifier", block)
      this.referenceIdentifier(blockType, identifierText, identifierPos)
    }
  }

  // 'int', 'real', 'bool', etc
  handleTypeToken(typeText) {
    const block = this.peekBlock()
    if (!block) {
      console.log("warn: block type not found")
      return
    }

    const type = typeTokenToType[typeText]
      ?? IdentifierType.Unknown

    switch (block.type) {
      case SemanticContextType.GlobalConstantDecl:
      case SemanticContextType.GlobalVariableDecl:
      case SemanticContextType.LocalVariableDecl:
      case SemanticContextType.RecordVariableDecl: {
        if (type === IdentifierType.Unknown) {
          console.log("warn: unknown type text", typeText)
        }

        block.metadata.type = type
        break
      }

      case SemanticContextType.FnDecl: {
        block.metadata.signatures[0].output = type
        break
      }

      case SemanticContextType.FnParamsDecl: {
        const fnBlock = this.searchNearestBlock(block => block.type === SemanticContextType.FnDecl)
        if (fnBlock) {
          fnBlock.metadata.signatures[0].input.push(type)
          const currentIdentText = block.metadata.currentIdentifier
          const currentIdent = this.context.identifierStack.peek(currentIdentText)
          if (currentIdent) {
            currentIdent.type = type
            block.metadata.currentIdentifier = null
            const currentFn = this.context.identifierStack.peek(fnBlock.metadata.identifier)
            if (currentFn) {
              currentFn.fnParams.push(currentIdentText)
            }
          } else {
            console.log("warn: no identifier caught in fn params", block, typeText)
          }
        } else {
          console.log("warn: no fn decl block exists before fn params block", block)
        }
        break
      }
    }
  }

  deduceActionCall(actionKind, action, inputActualLength, position) {
    const fn = this.context.actionTable.peek(actionKind, action)
    if (!fn) {
      // This will happen when calling from an unregistered function
      // pushing a hole will save the integrity of the type stack

      // console.log("warn: invalid fn when exit fnCall", action)
      this.context.typeStack.push(IdentifierType.Hole)
      return
    }

    let output = IdentifierType.Unknown
    let pass = false
    for (let signature of fn.signatures) {
      const inputExpectedLength = signature.input.length
      if (inputExpectedLength !== inputActualLength) {
        continue
      }
      if (inputActualLength > 0) {
        const types = this.context.typeStack.slice(0 - inputActualLength)
        const {passed, hole} = checkSignature(signature.input, types)
        if (passed) {
          pass = true
          if (hole) {
            output = IdentifierType.Hole
          } else {
            output = signature.output
          }
          break
        }
      }
    }

    if (pass) {
      popMulti(this.context.typeStack, inputActualLength)
    } else {
      const currentTypesOrdered = popMultiStore(this.context.typeStack, inputActualLength).reverse()
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.TypeError,
        ...position,
        msg: `type mismatch on function ${action}, got: ${formatTypes(currentTypesOrdered)}, expected types are: ${formatSignatureInputs(fn.signatures)}`
      })
      output = IdentifierType.Hole
    }

    this.context.typeStack.push(output)
  }

  resetTypeStack() {
    if (this.context.typeStack.length) {
      this.context.typeStack = []
    }
  }

  pushKnownType(type) {
    this.context.typeStack.push(type)
  }

  deduceVariableDecl(block, pos) {
    const ident = block.metadata.identifier
    const identInfo = this.context.identifierStack.peek(ident)

    if (!identInfo) {
      console.log("warn: invalid identifier when exit variableDecl", block)
      return
    }

    const type = this.context.typeStack.pop() ?? block.metadata?.type
    const isException = type === IdentifierType.Int && identInfo.type === IdentifierType.Real // that's dangerous ...
    if (type !== identInfo.type && type !== IdentifierType.Hole && !isException) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.TypeError,
        ...pos,
        msg: `type mismatch when declaring variables, expected ${formatType(identInfo.type)}, got ${formatType(type)}`
      })

      // NO PUSH TO TYPE STACK AGAIN
    }


    // this.resetTypeStack()
  }

  deduceToType(type, position, pushType = null, pushSelf = false, allowNull = false) {
    const actualType = this.context.typeStack.pop()
    const isCorrect = type == null || actualType === type || actualType === IdentifierType.Hole || (allowNull && actualType == null)

    if (pushType != null) {
      this.context.typeStack.push(pushType)
    } else if (pushSelf) {
      this.context.typeStack.push(actualType)
    }

    if (!isCorrect) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.TypeError,
        ...position,
        msg: `type mismatch: expecting ${formatType(type)}, got ${formatType(actualType)}`
      })
    }
  }

  deduceToMultiTypes(types, position, pushType = null, pushSelf = false) {
    const actualType = this.context.typeStack.pop()
    const isCorrect = types.includes(actualType) || actualType === IdentifierType.Hole

    if (pushType != null || pushSelf) {
      this.context.typeStack.push(pushType == null ? actualType : pushType)
    }

    if (!isCorrect) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.TypeError,
        ...position,
        msg: `type mismatch: expecting ${formatTypes(types)}, got ${formatType(actualType)}`
      })
    }
  }

  deduceAllToType(type, position, pushType = null, atLeast = 1) {
    const actualTypes = this.context.typeStack
    const isCorrect = (atLeast === 0 && actualTypes.length === 0)
      || (actualTypes.length >= atLeast && actualTypes.every(actualType => actualType === type || actualType === IdentifierType.Hole))

    if (pushType != null) {
      this.context.typeStack = [pushType]
    }

    if (!isCorrect) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.TypeError,
        ...position,
        msg: `type mismatch: expecting ${atLeast ? `at least ${atLeast} ` : ""} (...${formatType(type)}), got ${formatTypes(actualTypes)}`
      })
    }
  }

  checkNamedExpr(name, position, msg, allowedScopes = []) {
    const scope = this.latestNthScope()
    if (!scope) {
      console.log("warn: use of initial without scope")
    }

    if (!allowedScopes.includes(scope.type)) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.SemanticError,
        ...position,
        msg
      })
    }

    // if (notAllowedBlockTypes.length && this.searchNearestBlock(block => notAllowedBlockTypes.includes(block.type)) != null) {
    //   this.context.errorStorage.setError({
    //     source: ErrorSource.Semantic,
    //     kind: ErrorKind.SemanticError,
    //     ...position,
    //     msg
    //   })
    // }
  }

  checkOption(optName, lit, position) {
    const opt = optionAcceptableValues.get(optName)
    if (!opt) {
      return
    }

    if (this.context.definedOptions.has(optName)) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.SemanticError,
        ...position,
        msg: `option '${optName}' has already be defined`
      })

      return
    }

    const es = []

    const {values, regex, description} = opt
    if (values && !values.includes(lit)) {
      es.push({
        source: ErrorSource.Semantic,
        kind: ErrorKind.TypeError,
        ...position,
        msg: `option '${optName}' could only accept these values: ${values.join(",")}`
      })
    }

    if (regex && !regex.test(lit)) {
      es.push({
        source: ErrorSource.Semantic,
        kind: ErrorKind.TypeError,
        ...position,
        msg: `option '${optName}' could only accept: ${description}`
      })
    }

    this.context.definedOptions.add(optName)

    if (es.length) {
      this.context.errorStorage.setErrors(es)
    }
  }

  handleStateDecl(block, attrs, position) {
    const es = []
    const identifier = block.metadata.identifier
    if (attrs.isStart) {
      const startIdent = this.context.startNodeIdentifier
      if (startIdent != null) {
        es.push({
          source: ErrorSource.Semantic,
          kind: ErrorKind.SemanticError,
          ...position,
          msg: `start node already defined as '${startIdent}', only 1 start node could exist in current machine`
        })
      } else {
        this.context.startNodeIdentifier = identifier
      }
    }

    if (attrs.isAbstract && block.metadata.hasChildren === true) {
      es.push({
        source: ErrorSource.Semantic,
        kind: ErrorKind.SemanticWarning,
        ...position,
        msg: "code inside abstract node / state will be ignored"
      })
    }

    if (es.length) {
      this.context.errorStorage.setErrors(es)
    }

    this.context.editorCtx.defineState(identifier, attrs)
  }

  handleGoal() {
    this.context.goalDefined = true
  }

  handleMachineDecl(pos) {
    const es = []
    if (!this.context.goalDefined) {
      es.push({
        source: ErrorSource.Semantic,
        kind: ErrorKind.SemanticWarning,
        ...pos,
        msg: "no goal defined in machine"
      })
    }

    if (this.context.startNodeIdentifier == null) {
      es.push({
        source: ErrorSource.Semantic,
        kind: ErrorKind.SemanticWarning,
        ...pos,
        msg: "no start node defined in machine"
      })
    }

    if (es.length) {
      this.context.errorStorage.setErrors(es)
    }
  }

  handleReturn(position) {
    const scope = this.searchNearestScope(scope => scope.type === SemanticContextType.FnBodyScope)

    if (!scope) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.SemanticError,
        ...position,
        msg: "'return' expression can only be used in function"
      })

      return
    }

    if (scope.metadata.isReturned) {
      return
    }

    scope.metadata.isReturned = true

    const decl = this.searchNearestBlock(block => block.type === SemanticContextType.FnDecl)
    if (!decl) {
      console.log("warn: unknown function declaration", position)
      return
    }

    const type = this.context.typeStack.pop() ?? IdentifierType.Unknown
    const expectedType = decl.metadata.signatures[0].output
    if (type !== expectedType) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.TypeError,
        ...position,
        msg: `type mismatch: function expected to return ${formatType(expectedType)}, got ${formatType(type)}`
      })
    }
  }

  handleStatement(position) {
    const scope = this.latestNthScope()
    if (scope && scope.type === SemanticContextType.FnBodyScope && scope.metadata.isReturned) {
      this.context.errorStorage.setError({
        source: ErrorSource.Semantic,
        kind: ErrorKind.SemanticError,
        ...position,
        msg: "unreachable code: statement after 'return'"
      })
    }
  }

  handleTransExclusion(isEnter) {
    const block = this.peekBlock(1)
    block.metadata.exclusionFlag = isEnter
  }

  handleTransOp(op) {
    this.peekBlock(1).metadata.operators.add(op)
  }

  handleTransLabel(label) {
    this.peekBlock(1).metadata.label = label.slice(1, label.length - 1).trim()
  }

  handleTransWhereExpr(expr) {
    this.peekBlock(1).metadata.whereExpr = expr
      .slice("where ".length)
      .replace(/(?:\r\n|\r|\n)/g, " ")
      .replace(/\s\s+/g, " ")
  }

  handleTrans(block) {
    const md = block.metadata
    this.context.editorCtx.defineTransition(
      md.identifier,
      md.label,
      md.whereExpr,
      md.fromState,
      md.toStates,
      md.operators,
      md.excludedStates
    )
  }
}