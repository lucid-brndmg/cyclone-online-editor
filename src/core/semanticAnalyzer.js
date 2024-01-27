import {
  ActionKind,
  ErrorSource,
  ErrorType,
  IdentifierKind,
  IdentifierType,
  SemanticContextType
} from "@/core/definitions";
import {CategorizedStackTable} from "@/lib/storage";
import {
  builtinActions,
  declarationContextType,
  declarationContextTypeToIdentifierKind,
  declarationGroupContextTypeToIdentifierKind,
  identifierKindToType,
  identifierNoPushTypeStackBlocks,
  optionAcceptableValues,
  scopedContextType,
  scopeSupportsShadowing,
  singleTypedDeclarationGroupContextType,
  typeTokenToType
} from "@/core/specification";
import {
  declareMetadata,
  scopeMetadata,
  semanticContextMetadataTable,
  singleTypedDeclGroupMetadata
} from "@/core/utils/metadata";
import {popMulti, popMultiStore} from "@/lib/list";
import {checkSignature} from "@/core/utils/types";

class SemanticAnalyzerContext {
  #blockContextStack
  #scopedBlocks
  #actionTable
  #typeStack
  #definedOptions

  constructor() {
    this.#blockContextStack = []
    this.#scopedBlocks = []
    this.#actionTable = new CategorizedStackTable(builtinActions)
    this.#typeStack = []
    this.#definedOptions = new Set()
  }

  get currentMachineBlock() {
    return this.#blockContextStack[1]
  }

  get currentBlockPath() {
    return this.#blockContextStack.map(it => it.type)
  }

  get scopeLength() {
    return this.#scopedBlocks.length
  }

  pushBlock(block) {
    this.#blockContextStack.push(block)
    if (scopedContextType.has(block.type)) {
      this.#scopedBlocks.push(block)
    }
  }

  peekBlock(skip = 0) {
    return this.#blockContextStack[this.#blockContextStack.length - 1 - skip]
  }

  popBlock() {
    const block = this.#blockContextStack.pop()
    if (block) {
      if (scopedContextType.has(block.type)) {
        this.#clearScope(block)
        this.#scopedBlocks.pop()
      }
      // if (block.type === SemanticContextType.RecordDecl) {
      //   this.context.currentRecordIdent.pop()
      // }
    } else {
      console.log("warn: no block to pop")
    }
    return block
  }
  #clearScope(block) {
    // this.emit("scope:exit", block)
    const machineCtx = this.currentMachineBlock?.metadata
    if (block.metadata && machineCtx) {
      machineCtx.identifierStack.subCountTable(block.metadata?.identifierCounts)
      // this.context.identifierCounts.sub(block.metadata?.identifierCounts)
      // this.context.recordCounts.sub(block.metadata?.recordCounts)
      machineCtx.recordFieldStack.subCategorizedCountTable(block.metadata.recordCounts)
    } else if (machineCtx) {
      console.log("warn: no local identifier count table found")
    }
  }

  peekScope(skip = 0) {
    return this.#scopedBlocks[this.#scopedBlocks.length - 1 - skip]
  }

  searchNearestBlock(f, stopAtType = null, skip = 0) {
    for (let i = this.#blockContextStack.length - 1 - skip; i >= 0; i--) {
      const block = this.#blockContextStack[i]
      if (f(block)) {
        return block
      }
      if (block.type === stopAtType) {
        return null
      }
    }

    return null
  }

  findNearestBlock(type, stopAt = null) {
    for (let i = this.#blockContextStack.length - 1; i >= 0; i--) {
      const block = this.#blockContextStack[i]
      if (block.type === type) {
        return block
      }
      if (stopAt !== null && block.type === stopAt) {
        return null
      }
    }

    return null
  }

  findNearestBlockByTypes(types) {
    for (let i = this.#blockContextStack.length - 1; i >= 0; i--) {
      const block = this.#blockContextStack[i]
      if (types.includes(block.type)) {
        return block
      }
    }

    return null
  }

  findNearestScope(type) {
    for (let i = this.#scopedBlocks.length - 1; i >= 0; i--) {
      const scope = this.#scopedBlocks[i]
      if (scope.type === type) {
        return scope
      }
    }

    return null
  }

  resetTypeStack(types = null) {
    if (types) {
      this.#typeStack = types
    } else if (this.#typeStack.length) {
      this.#typeStack = []
    }

    // if (this.typeStack.length) {
    //   this.typeStack = []
    // }
  }

  pushTypeStack(type) {
    this.#typeStack.push(type)
  }

  popTypeStack() {
    return this.#typeStack.pop()
  }

  peekTypeStack() {
    return this.#typeStack[this.#typeStack.length - 1]
  }

  sliceTypeStack(start, end) {
    return this.#typeStack.slice(start, end)
  }

  removeMultiTypeStack(length) {
    popMulti(this.#typeStack, length)
  }

  popMultiTypeStack(length) {
    return popMultiStore(this.#typeStack, length)
  }

  getTypeStack() {
    return this.#typeStack
  }

  getAction(actionKind, action) {
    // TODO: optimize certain action kind

    const machine = this.currentMachineBlock
    let fn = machine.metadata.actionTable.peek(actionKind, action)
    if (!fn) {
      // public actions
      fn = this.#actionTable.peek(actionKind, action)
    }

    return fn
  }

  addDefinedOption(option) {
    this.#definedOptions.add(option)
  }

  isOptionDefined(option) {
    return this.#definedOptions.has(option)
  }
}

export default class SemanticAnalyzer {
  context
  events

  constructor() {
    this.context = new SemanticAnalyzerContext()
    this.events = new Map()
  }

  emitBlock(isEnter, payload, block) {
    const e = `block:${isEnter ? "enter" : "exit"}`
    this.emit(e, {
      // listener should get the current path by event.currentPath
      // position = block.position
      payload,
      block
    })
  }

  emit(event, payload) {
    if (this.events.has(event)) {
      const es = this.events.get(event)
      if (!es.length) {
        return
      }
      for (let h of this.events.get(event)) {
        h(this.context, payload)
      }
    }
  }

  on(event, handler) {
    if (this.events.has(event)) {
      this.events.get(event).push(handler)
    } else {
      this.events.set(event, [handler])
    }
  }

  pushBlock(type, position, payload, metadataParams = null) {
    let table = null
    const isScope = scopedContextType.has(type)
    if (isScope) {
      // const [x, y] = this.context.scopeCoords
      table = scopeMetadata()
    } else if (declarationContextType.has(type)) {
      table = declareMetadata()
    } else if (singleTypedDeclarationGroupContextType.has(type)) {
      table = singleTypedDeclGroupMetadata()
    }

    const metadataBuilder = semanticContextMetadataTable[type]
    const metadata = metadataBuilder ? metadataBuilder(metadataParams) : null

    const blockContent = {
      type,
      position,
      // index: this.context.blockContextStack.length,
      // identifierTable: new Map(), // Map<Kind, Map<Ident, [definitions]>>
      metadata: table || metadata ? {...table, ...metadata} : null
    }
    
    this.context.pushBlock(blockContent)
    this.emitBlock(true, payload, blockContent)
  }

  popBlock(payload) {
    const block = this.context.peekBlock()
    this.emitBlock(false, payload, block)
    return this.context.popBlock()
  }
  referenceEnum(identText, position) {
    this.emit("identifier:reference", {references: [{text: identText, position, isEnum: true}]})
    this.pushTypeStack(IdentifierType.Enum)
    const machine = this.context.currentMachineBlock
    if (!machine.metadata.enumFields.has(identText)) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.UndefinedIdentifier,
        params: {desc: "enum literal", ident: `#${identText}`}
      }])
    }
    // return null
  }

  registerIdentifier(block, identText, identPos) {
    // check duplication
    const blockType = block.type
    const scope = this.context.peekScope()
    if (!scope) {
      console.log("warn: scope not found", blockType, identText, identPos)
    }

    let identKind = declarationContextTypeToIdentifierKind[blockType]
      ?? IdentifierKind.Unknown
    if (identKind === IdentifierKind.Unknown) {
      const prev = this.context.peekBlock(1)
      identKind = declarationGroupContextTypeToIdentifierKind[prev.type] ?? IdentifierKind.Unknown
    }
    let isEnum = blockType === SemanticContextType.EnumDecl

    // NOTE: Enum fields don't have types, their types are always -1
    const type = identifierKindToType[identKind]
      ?? block.metadata.fieldType
    const machineCtx = this.context.currentMachineBlock.metadata
    // console.log("support shadowing: ", scopeSupportsShadowing.get(scope.type)?.has(identKind), scope.type, identKind)
    const hasCount = !isEnum && (scope
      ? scopeSupportsShadowing.get(scope.type)?.has(identKind)
        ? scope.metadata.identifierCounts.get(identText) > 0
        : machineCtx.identifierStack.getLength(identText) > 0
      : machineCtx.identifierStack.getLength(identText) > 0)

    // this.context.identifierCounts.hasCounts(registrationCheckKinds, identText)

    if (hasCount) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...identPos,

        type: ErrorType.IdentifierRedeclaration,
        params: {ident: identText}
      }])
    }

    let fnSignature = null

    switch (blockType) {
      case SemanticContextType.FnDecl: {
        machineCtx.actionTable.push(ActionKind.Function, identText, {
          action: identText,
          kind: ActionKind.Function,
          signatures: block.metadata.signatures
        })
        fnSignature = block.metadata.signatures[0]
        // block.metadata.identifier = identText
        break
      }

      case SemanticContextType.EnumDecl: {
        machineCtx.enumFields.add(identText)
        const prev = this.context.peekBlock(1)
        if (prev.metadata.enums.includes(identText)) {
          this.emit("errors", [{
            source: ErrorSource.Semantic,
            type: ErrorType.DuplicatedEnumField,
            params: {text: identText},
            ...identPos
          }])
        }
        prev.metadata.enums.push(identText)
        break
      }
    }

    if (declarationContextType.has(blockType)) {
      block.metadata.identifier = identText
    }

    // this.context.editorCtx.pushScopeLayerIdent(identText, type, identPos, identKind, blockType, this.context.scopedBlocks.length)
    const isRecordMemberDef = !isEnum && scope.type === SemanticContextType.RecordScope
      // current block is not enum decl
      // (since enum decl also involves identifiers)
      && this.context.peekBlock().type !== SemanticContextType.EnumDecl
    const recordDecl = isRecordMemberDef ? this.context.findNearestBlock(SemanticContextType.RecordDecl) : null
    const recordIdent = recordDecl?.metadata.identifier // this.context
    const payload = {
      text: identText,
      type,
      position: identPos,
      kind: identKind,
      blockType,
      recordIdent
      // isEnum
    }

    this.emit("identifier:register", payload)
    // this.emitLangComponent(context, payload)

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
        // this.context.findNearestBlock(SemanticContextType.EnumDecl, SemanticContextType.RecordScope) === null
        // && this.searchNearestBlock(
        //   block => block.metadata?.blockCurrentRecord === true,
        //   SemanticContextType.RecordScope,
        //   // this.context.blockContextStack.length - scope.index
        // ) === null
      if (recordIdent) {
        // info.recordIdent = recordIdent

        const recordInfo = machineCtx.identifierStack.peek(recordIdent)
        recordInfo?.recordChild?.push({
          text: identText,
          type,
          kind: identKind
        })
        // no need to check current counts here
        // cuz RecordScope is already a scope

        // scope?.metadata.recordCounts.incr(recordIdent, identText)
        const prevScope = this.context.peekScope(1)
        if (prevScope) {
          prevScope?.metadata.recordCounts.incr(recordIdent, identText)
        } else {
          console.log("warn: no previous scope exists before current scope")
        }
        // this.context.recordCounts.incr(recordIdent, identText)
        machineCtx.recordFieldStack.push(recordIdent, identText, info)
      }
      // if (isRecordMemberDef) {
      //   const recordDecl = this.context.findNearestBlock(SemanticContextType.RecordDecl)
      //   const recordIdent = recordDecl.metadata.identifier // this.context.currentRecordIdent[this.context.currentRecordIdent.length - 1]
      //
      // }

      machineCtx.identifierStack.push(identText, info)
      scope.metadata.identifierCounts.incr(identText)
    }

    // this.context.identifierCounts.incr(identKind, identText)
  }

  referenceIdentifier(blockType, identText, identPos) {
    // check existence
    this.emit("identifier:reference", {references: [{position: identPos, text: identText, isEnum: false}]})
    let errParams = {
      desc: "identifier",
      ident: identText
    }
    let kindLimitations = null
    const identifiers = this.context.currentMachineBlock.metadata.identifierStack

    const ident = identifiers.peek(identText)
    let shouldNotPushTypeStackBlocks = identifierNoPushTypeStackBlocks.has(blockType)
    const es = []

    switch (blockType) {
      // case SemanticContextType.StateInc:
      case SemanticContextType.TransScope:
      case SemanticContextType.InExpr:
      case SemanticContextType.Stop:
      case SemanticContextType.PathPrimary: {
        kindLimitations = [IdentifierKind.State]
        errParams.desc = "state"
        break
      }

      case SemanticContextType.StateInc: {
        kindLimitations = [IdentifierKind.State, IdentifierKind.Let]
        errParams.desc = "state or path"
        break
      }

      case SemanticContextType.With: {
        kindLimitations = [IdentifierKind.Invariant]
        errParams.desc = "invariant"
        break
      }

      case SemanticContextType.GoalScope: {
        if (ident && ident.type !== IdentifierType.Bool) {
          es.push({
            source: ErrorSource.Semantic,
            ...identPos,

            type: ErrorType.TypeMismatchVarRef,
            params: {ident: identText, expected: IdentifierType.Bool}
          })
        }
        break
      }

      case SemanticContextType.FnCall: {
        if (ident) {
          const functionDecl = this.context.findNearestBlock(SemanticContextType.FnDecl)
          const fnName = functionDecl?.metadata.identifier
          if (fnName === identText && ident.kind === IdentifierKind.FnName) {
            es.push({
              source: ErrorSource.Semantic,
              ...identPos,

              type: ErrorType.RecursiveFunction,
              params: {ident: identText}
            })
          }
        }

        const block = this.context.peekBlock()
        if (block.metadata.gotReference === 0) {
          // the function itself can not be pushed to typeStack
          shouldNotPushTypeStackBlocks = true
        }
        block.metadata.gotReference += 1

        break
      }
    }

    const whereBlock = this.context.findNearestBlock(SemanticContextType.WhereExpr)
    if (whereBlock) {
      const variableDeclBlock = this.context.findNearestBlock(SemanticContextType.VariableDecl)
      if (variableDeclBlock) {
        const ident = variableDeclBlock.metadata.identifier
        if (ident !== identText && identifiers.peek(identText)?.kind !== IdentifierKind.GlobalConst) {
          es.push({
            source: ErrorSource.Semantic,
            ...identPos,

            type: ErrorType.WhereFreeVariable,
            params: {ident, freeVariable: identText}
          })
        }
      }
    }

    if (!ident || (kindLimitations != null && !kindLimitations.includes(ident.kind))) {
      es.push({
        source: ErrorSource.Semantic,
        ...identPos,

        type: ErrorType.UndefinedIdentifier,
        params: errParams
      })
    }

    // console.log("ref", identText, ident, shouldPushTypeStack, blockType)

    if (!shouldNotPushTypeStackBlocks) {
      this.pushTypeStack(ident?.type ?? IdentifierType.Hole)
    }

    if (es.length) {
      this.emit("errors", es)
    }
  }

  referenceRecordField(parentIdentText, parentPos, identText, identPos) {
    // pop the Record pushed before
    this.context.popTypeStack()
    const scope = this.context.peekScope()
    const es = []
    const machineCtx = this.context.currentMachineBlock.metadata
    this.emit("identifier:reference", {references: [{position: parentPos, text: parentIdentText, isEnum: false}, {position: identPos, text: identText, isEnum: false}]})

    if (!scope) {
      console.log("warn: scope not found when reference record field", parentIdentText, identText, identPos)
    }

    const ident = machineCtx.identifierStack.peek(parentIdentText)

    const hasRecord = ident && ident.kind === IdentifierKind.Record // this.context.identifierCounts.hasCounts([IdentifierKind.Record], parentIdentText)
    if (!hasRecord) {
      es.push({
        source: ErrorSource.Semantic,
        ...parentPos,

        type: ErrorType.UndefinedIdentifier,
        params: {desc: "record", ident: parentIdentText}
      })
    }

    const hasRecordField = hasRecord && machineCtx.recordFieldStack.getLength(parentIdentText, identText) > 0 // this.context.recordCounts.hasCounts([parentIdentText], identText)
    if (!hasRecordField) {
      es.push({
        source: ErrorSource.Semantic,
        ...identPos,

        type: ErrorType.UndefinedIdentifier,
        params: {desc: "record field", ident: `${parentIdentText}.${identText}`}
      })
      this.pushTypeStack(IdentifierType.Hole)
    } else {
      const recordField = machineCtx.recordFieldStack.peek(parentIdentText, identText)
      this.pushTypeStack(recordField.type)
    }

    if (es.length) {
      this.emit("errors", es)
    }

  }

  handleIdentifier(identifierText, identifierPos) {
    const block = this.context.peekBlock()
    if (!block) {
      console.log("warn: block type not found")
      return
    }

    const blockType = block.type
    if (declarationContextType.has(blockType)) {
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
    const block = this.context.peekBlock()
    if (!block) {
      console.log("warn: block type not found")
      return
    }

    const type = typeTokenToType[typeText]
      ?? IdentifierType.Hole

    switch (block.type) {
      case SemanticContextType.FnDecl: {
        block.metadata.signatures[0].output = type
        break
      }

      case SemanticContextType.FnParamsDecl: {
        const fnBlock = this.context.findNearestBlock(SemanticContextType.FnDecl)
        if (fnBlock) {
          fnBlock.metadata.signatures[0].input.push(type)
          const currentIdentText = block.metadata.identifier
          const machineCtx = this.context.currentMachineBlock.metadata
          const currentIdent = machineCtx.identifierStack.peek(currentIdentText)
          if (currentIdent) {
            currentIdent.type = type
            // block.metadata.currentIdentifier = null
            const currentFn = machineCtx.identifierStack.peek(fnBlock.metadata.identifier)
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

      default: {
        if (singleTypedDeclarationGroupContextType.has(block.type)) {
          // case SemanticContextType.EnumGroup:
          // case SemanticContextType.GlobalConstantGroup:
          // case SemanticContextType.GlobalVariableGroup:
          // case SemanticContextType.LocalVariableGroup:
          block.metadata.fieldType = type
        }

        break

      }
    }
  }

  handleFunCall(actionKind) {
    const block = this.context.peekBlock()
    const position = block.position
    if (this.context.findNearestBlock(SemanticContextType.WhereExpr)) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.WhereFunctionCall
      }])
    }
    this.deduceActionCall(actionKind, block.metadata.fnName, block.metadata.gotParams, position)
  }

  deduceActionCall(actionKind, action, inputActualLength, position) {
    const fn = this.context.getAction(actionKind, action)
    if (!fn) {
      // This will happen when calling from an unregistered function
      // pushing a hole will save the integrity of the type stack

      // console.log("warn: invalid fn when exit fnCall", action)
      this.pushTypeStack(IdentifierType.Hole)
      return
    }

    let output = IdentifierType.Hole
    let pass = false
    for (let signature of fn.signatures) {
      const inputExpectedLength = signature.input.length
      if (inputExpectedLength !== inputActualLength) {
        continue
      }
      if (inputActualLength > 0) {
        const types = this.context.sliceTypeStack(0 - inputActualLength)
        const {passed, hole} = checkSignature(signature.input, types)
        if (passed) {
          pass = true
          if (!hole) {
            output = signature.output
          }
          break
        }
      }
    }

    if (pass) {
      // popMulti(this.context.typeStack, inputActualLength)
      this.context.removeMultiTypeStack(inputActualLength)
    } else {
      const currentTypesOrdered = this.context.popMultiTypeStack(inputActualLength).reverse() // popMultiStore(this.context.typeStack, inputActualLength).reverse()
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.TypeMismatchFunction,
        params: {ident: action, got: currentTypesOrdered, expected: fn.signatures}
      }])
      output = IdentifierType.Hole
    }

    this.pushTypeStack(output)
  }

  resetTypeStack(types) {
    // if (this.context.typeStack.length) {
    //   this.context.typeStack = []
    // }

    this.context.resetTypeStack(types)
  }

  pushTypeStack(type) {
    this.context.pushTypeStack(type)
  }

  deduceVariableInit() {
    const block = this.context.peekBlock(1)
    const pos = block.position
    const ident = block.metadata.identifier
    const identInfo = this.context.currentMachineBlock.metadata.identifierStack.peek(ident)

    if (!identInfo) {
      console.log("warn: invalid identifier when exit variableDecl", block)
      return
    }

    const type = this.context.popTypeStack() // int a = 1;
      ?? block.metadata?.fieldType // int a;
    const isException = type === IdentifierType.Int && identInfo.type === IdentifierType.Real // that's dangerous ...
    if (type !== identInfo.type && type !== IdentifierType.Hole && !isException) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...pos,

        type: ErrorType.TypeMismatchVarDecl,
        params: {ident, expected: identInfo.type, got: type}
      }])

      // NO PUSH TO TYPE STACK AGAIN
    }


    // this.resetTypeStack()
  }

  deduceToType(type, position = null, pushType = null, allowNull = false) {
    const actualType = this.context.popTypeStack()
    const isCorrect = actualType === type
      || actualType === IdentifierType.Hole
      || (allowNull && actualType == null)

    if (pushType != null) {
      this.pushTypeStack(pushType)
    }

    if (!isCorrect) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...(position ?? this.context.peekBlock().position),

        type: ErrorType.TypeMismatchExpr,
        params: {expected: [type], got: [actualType]}
      }])
    }
  }

  deduceToMultiTypes(types, position, pushType = null, pushSelf = false) {
    const actualType = this.context.popTypeStack()
    const isCorrect = types.includes(actualType) || actualType === IdentifierType.Hole

    if (pushType != null || pushSelf) {
      this.pushTypeStack(pushType == null ? actualType : pushType)
    }

    if (!isCorrect) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.TypeMismatchExpr,
        params: {expected: types, got: [actualType]}
      }])
    }
  }

  deduceAllToType(type, position, pushType = null, atLeast = 1) {
    const actualTypes = this.context.getTypeStack()
    const isCorrect = (atLeast === 0 && actualTypes.length === 0)
      || (
        actualTypes.length >= atLeast
        && actualTypes.every(actualType =>
          actualType === type
          || actualType === IdentifierType.Hole
        )
      )

    if (pushType != null) {
      this.context.resetTypeStack([pushType])
    }

    if (!isCorrect) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.TypeMismatchExpr,
        params: {expected: [type], got: actualTypes, minLength: atLeast}
      }])
    }
  }

  checkNamedExpr(position, allowedScopes = []) {
    const scope = this.context.peekScope()
    if (!scope) {
      console.log("warn: use of initial without scope")
      return false
    }

    return allowedScopes.includes(scope.type)
  }

  checkOption(optName, lit) {
    const block = this.context.peekBlock()
    block.metadata.name = optName
    block.metadata.value = lit
    const position = block.position
    // this.emitLangComponent(context, {name: optName, value: lit})

    const opt = optionAcceptableValues.get(optName)
    if (!opt) {
      return
    }

    if (this.context.isOptionDefined(optName)) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.CompilerOptionDuplicated,
        params: {ident: optName}
      }])
      return
    }

    const es = []

    const {values, regex, description} = opt
    if (values && !values.includes(lit)) {
      es.push({
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.TypeMismatchCompilerOption,
        params: {ident: optName, expected: values}
      })
    }

    if (regex && !regex.test(lit)) {
      es.push({
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.TypeMismatchCompilerOption,
        params: {ident: optName, desc: description}
      })
    }

    this.context.addDefinedOption(optName)

    if (es.length) {
      this.emit("errors", es)
    }
  }

  handleInitialExpr(position) {
    const scopes = [SemanticContextType.StateScope, SemanticContextType.GoalScope]

    const valid = this.checkNamedExpr(
      position,
      // `'initial' expression can only be used in global / state / node scope, and not in constant definition`,
      scopes
    )

    if (!valid) {
      this.emit("errors", [{
        type: ErrorType.InvalidNamedExprScope,
        ...position,
        params: {
          ident: "initial",
          scopes
        }
      }])
    }
  }

  handleFreshExpr(position) {
    const scopes = [SemanticContextType.StateScope, SemanticContextType.GoalScope]
    const valid = this.checkNamedExpr(
      position,
      // `'fresh' expression can only be used in global / state / node scope, and not in constant definition`,
      scopes
    )

    if (!valid) {
      this.emit("errors", [{
        type: ErrorType.InvalidNamedExprScope,
        ...position,
        params: {
          ident: "fresh",
          scopes
        }
      }])
    }
  }

  handleStateDecl(attrs) {
    const block = this.context.peekBlock()
    const position = block.position

    block.metadata.attributes = attrs

    const es = []
    const identifier = block.metadata.identifier
    const machine = this.context.currentMachineBlock
    if (attrs.includes("start")) {
      const startIdent = machine.metadata.startNodeIdentifier
      if (startIdent != null) {
        es.push({
          source: ErrorSource.Semantic,
          ...position,

          type: ErrorType.StartNodeDuplicated,
          params: {ident: startIdent}
        })
      } else {
        machine.metadata.startNodeIdentifier = identifier
      }
    }

    if (attrs.includes("abstract") && block.metadata.hasChildren === true) {
      es.push({
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.CodeInsideAbstractNode,
      })
    }

    if (es.length) {
      this.emit("errors", es)
    }
    machine.metadata.stateSet.add(identifier)
  }

  handleStateScope(hasStatement) {
    this.context.peekBlock().metadata.hasChildren = hasStatement
  }

  handleGoal() {
    // const block = this.context.peekBlock()
    this.context.currentMachineBlock.metadata.goalDefined = true
    // this.emit("lang:goal", block)
  }

  handleMachineDeclEnter(keyword, keywordPosition) {
    const block = this.context.peekBlock()
    block.metadata.keywordPosition = keywordPosition
    block.metadata.keyword = keyword
    // this.emitLangComponent(context, {keyword})
  }

  handleMachineDeclExit() {
    const block = this.context.peekBlock()
    const pos = block.metadata.keywordPosition
    if (!pos) {
      return
    }

    const es = []
    if (!block.metadata.goalDefined) {
      es.push({
        source: ErrorSource.Semantic,
        ...pos,

        type: ErrorType.NoGoalDefined,
      })
    }

    if (block.metadata.startNodeIdentifier == null) {
      es.push({
        source: ErrorSource.Semantic,
        ...pos,

        type: ErrorType.NoStartNodeDefined
      })
    }

    if (es.length) {
      this.emit("errors", es)
    }
  }

  handleReturn(position) {
    const scope = this.context.findNearestScope(SemanticContextType.FnBodyScope)

    if (!scope) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.ReturnExprViolation
      }])

      return
    }

    if (scope.metadata.isReturned) {
      return
    }

    scope.metadata.isReturned = true

    const decl = this.context.findNearestBlock(SemanticContextType.FnDecl)
    if (!decl) {
      console.log("warn: unknown function declaration", position)
      return
    }

    const type = this.context.popTypeStack() ?? IdentifierType.Hole
    const expectedType = decl.metadata.signatures[0].output
    if (type !== expectedType) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.TypeMismatchReturn,
        params: {expected: expectedType, got: type}
      }])
    }
  }

  handleStatementEnter(position) {
    // this.emitLangComponent(context, null)

    const scope = this.context.peekScope()
    if (scope && scope.type === SemanticContextType.FnBodyScope && scope.metadata.isReturned) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.StatementAfterReturn
      }])
    }
  }

  handleStatementExit(position) {
    const type = this.context.peekTypeStack()
    if (type != null && type !== IdentifierType.Hole && type !== IdentifierType.Bool) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,
        params: {got: type},

        type: ErrorType.InvalidStatement
      }])
    }
    this.resetTypeStack()
  }

  handleTransExclusion(idents) {
    const transDecl = this.context.findNearestBlock(SemanticContextType.TransDecl).metadata
    for (let id of idents) {
      transDecl.excludedStates.push(id)
    }

    // block.metadata.exclusionFlag = isEnter
  }

  handleTransOp(op) {
    this.context.findNearestBlock(SemanticContextType.TransDecl).metadata.operators.add(op)
  }

  handleTransToStates(idents) {
    for (let id of idents) {
      this.context.findNearestBlock(SemanticContextType.TransDecl).metadata.toStates.push(id)
    }
  }

  handleTransLabel(label) {
    this.context.findNearestBlock(SemanticContextType.TransDecl).metadata.label = label.slice(1, label.length - 1).trim()
  }

  handleWhereExpr(expr) {
    const transBlock = this.context.findNearestBlock(SemanticContextType.TransDecl)

    // const block = this.context.peekBlock(1)
    const sanitized = expr
      .slice("where ".length)
      .replace(/(?:\r\n|\r|\n)/g, " ")
      .replace(/\s\s+/g, " ")

    if (transBlock) {
      transBlock.metadata.whereExpr = sanitized
    }

    this.context.peekBlock().metadata.expr = sanitized

    // this.emitLangComponent(ctx, null)
  }

  handleTrans() {
    const block = this.context.peekBlock()
    const position = block.position
    const md = block.metadata
    const {fromState, toStates, operators, excludedStates} = md
    const es = []
    const targetStates = new Set(toStates)
    const excludedStatesSet = new Set(excludedStates)

    if (!md.whereExpr) {
      const label = `${fromState ?? ""}|${[...targetStates].sort().join(",")}|${[...operators].sort().join(",")}|${[...excludedStatesSet].sort().join(",")}`
      const machine = this.context.currentMachineBlock
      if (machine.metadata.transitionSet.has(label)) {
        es.push({
          source: ErrorSource.Semantic,
          ...position,
          type: ErrorType.DuplicatedEdge
        })
      } else {
        machine.metadata.transitionSet.add(label)
      }
    }

    if (targetStates.size === 0) {
      const isExcludeSelf = operators.has("+")
      const machine = this.context.currentMachineBlock
      for (let state of machine.metadata.stateSet) {
        if (!(isExcludeSelf && state === fromState) && !excludedStatesSet.has(state)) {
          targetStates.add(state)
        }
      }
    }

    if (targetStates.size === 0) {
      es.push({
        source: ErrorSource.Semantic,
        ...position,
        type: ErrorType.EmptyEdge
      })
    }

    if (es.length) {
      this.emit("errors", es)
    }

    block.metadata.involvedStates = targetStates

    // this.emit("lang:transition", {metadata: md, targetStates, position, expr})
    // this.emitLangComponent(context, {targetStates})
  }

  handleTransScope(ident) {
    if (ident) {
      this.context.findNearestBlock(SemanticContextType.TransDecl).metadata.fromState = ident
    } else {
      console.trace("warn: start state not found for trans")
    }
  }

  handleInExpr(identifiers) {
    if (identifiers?.length) {
      // const assertionBlock = this.context.findNearestBlock(SemanticContextType.AssertExpr)
      // if (assertionBlock) {
      //   this.emit("lang:assertion:states", {expr, position: parentExprPos, identifiers})
      // } else {
      //   const invariantBlock = this.context.findNearestBlock(SemanticContextType.InvariantDecl)
      //   if (invariantBlock) {
      //     const name = invariantBlock.metadata.identifier
      //     this.emit("lang:invariant:states", {name, identifiers})
      //   }
      // }
      this.context.peekBlock().metadata.identifiers = identifiers
    }
  }

  handleStopExpr(identifiers) {
    const def = this.context.peekScope()
    if (identifiers?.length) {
      for (let id of identifiers) {
        def.metadata.states.push(id)
      }
    }
  }

  handleWithExpr(identifiers) {
    const def = this.context.peekScope()
    if (identifiers?.length) {
      for (let id of identifiers) {
        def.metadata.invariants.push(id)
      }
    }
  }

  handleCheckExpr(expr) {
    // this.context.peekScope().metadata.keyword = keyword
    const goal = this.context.peekScope()
    goal.metadata.expr = expr
    goal.metadata.finalPosition = this.context.peekBlock().position

    // this.emitLangComponent(context, null)
  }

  handleExpression() {
    const block = this.context.peekBlock()
    if (block.type === SemanticContextType.FnCall) {
      block.metadata.gotParams += 1
    }
  }

  handlePathCondAssign(expr) {
    this.deduceToType(IdentifierType.Bool)
    const decl = this.context.findNearestBlock(SemanticContextType.LetDecl)
    if (decl) {
      // decl.metadata.hasBody = true
      decl.metadata.body = expr
    }
  }

  handleLetExpr() {
    const block = this.context.peekBlock()
    const position = block.position
    this.deduceToType(IdentifierType.Bool, position, null, true)
    if (block.type === SemanticContextType.LetDecl && !block.metadata.body) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,
        type: ErrorType.LetBodyUndefined
      }])
    } else if (block.type !== SemanticContextType.LetDecl) {
      console.log("warn: let block not found")
    }
  }

  registerTypeForVariableDecl() {
    const prevBlock = this.context.peekBlock(1)
    if (singleTypedDeclarationGroupContextType.has(prevBlock.type)) {
      this.context.peekBlock().metadata.fieldType = prevBlock.metadata.fieldType
    }
  }

  handleIntLiteral() {
    const blockType = this.context.peekBlock().type
    if (blockType !== SemanticContextType.StateInc && blockType !== SemanticContextType.PathPrimary) {
      this.pushTypeStack(IdentifierType.Int)
    }
  }

  handleLocalVariableDeclGroup() {
    const block = this.context.peekBlock()
    if (block.metadata.fieldType === IdentifierType.Enum) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        type: ErrorType.LocalVariableEnum,
        ...block.position
      }])
    }
  }
}