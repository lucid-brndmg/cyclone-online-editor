import {
  ActionKind,
  ErrorSource, ErrorType,
  IdentifierKind,
  IdentifierType,
  SemanticContextType
} from "@/core/definitions";
import {CategorizedStackTable, StackedTable} from "@/lib/storage";
import {posPair} from "@/lib/position";
import {
  builtinActions,
  declarationContextType,
  declarationContextTypeToIdentifierKind, declarationGroupContextTypeToIdentifierKind,
  identifierKindToType,
  identifierNoPushTypeStackBlocks,
  optionAcceptableValues,
  scopedContextType,
  scopeSupportsShadowing, singleTypedDeclarationGroupContextType,
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

/*
* TODO:
* - check LET
* */

export default class SemanticAnalyzer {
  context
  events

  constructor() {
    this.context = {
      recordFieldStack: new CategorizedStackTable(),
      identifierStack: new StackedTable(),
      blockContextStack: [],
      scopedBlocks: [],
      actionTable: new CategorizedStackTable(builtinActions),
      typeStack: [],
      definedOptions: new Set(),
      transitionSet: new Set(),
      stateSet: new Set(),
      enumFields: new Set(),
    }

    this.events = new Map()
  }

  currentBlockPath() {
    return this.context.blockContextStack.map(it => it.type)
  }

  emitLangComponent(context, data, position = null, pathOverride = null) {
    // TODO: emit if someone listening ...
    // store context inside block??

    this.emit("lang:component", {
      path: pathOverride ?? this.currentBlockPath(),
      context,
      data,
      position: position ?? this.peekBlock().position,
    })
  }

  currentMachineBlock() {
    return this.context.blockContextStack[1]
  }

  ready(endPos) {
    this.pushBlock(SemanticContextType.ProgramScope, posPair(0, 0, 0, 0), endPos)
    this.emit("ready")
    // console.log(this.context)
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

  pushBlock(type, position, metadataParams = null) {
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

    this.context.blockContextStack.push(blockContent)
    if (isScope) {
      this.context.scopedBlocks.push(blockContent)
      // this.context.editorCtx.pushScopeLayerScope(this.context.scopedBlocks.length, type, position)
      this.emit("scope:enter", blockContent)
    }
  }

  clearScope(block) {
    this.emit("scope:exit", block)

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
      // if (block.type === SemanticContextType.RecordDecl) {
      //   this.context.currentRecordIdent.pop()
      // }
    } else if (clear) {
      console.log("warn: no block to pop")
    }
    return block
  }

  peekBlock(skip = 0) {
    return this.context.blockContextStack[this.context.blockContextStack.length - 1 - skip]
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

  findNearestBlock(type, stopAt = null) {
    for (let i = this.context.blockContextStack.length - 1; i >= 0; i--) {
      const block = this.context.blockContextStack[i]
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
    for (let i = this.context.blockContextStack.length - 1; i >= 0; i--) {
      const block = this.context.blockContextStack[i]
      if (types.includes(block.type)) {
        return block
      }
    }

    return null
  }

  findNearestScope(type) {
    for (let i = this.context.scopedBlocks.length - 1; i >= 0; i--) {
      const scope = this.context.scopedBlocks[i]
      if (scope.type === type) {
        return scope
      }
    }

    return null
  }

  referenceEnum(identText, position) {
    this.pushTypeStack(IdentifierType.Enum)
    if (!this.context.enumFields.has(identText)) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.UndefinedIdentifier,
        params: {desc: "enum literal", ident: `#${identText}`}
      }])
    }
    // return null
  }

  registerIdentifier(block, identText, identPos, context) {
    // check duplication
    const blockType = block.type
    const scope = this.latestNthScope()
    if (!scope) {
      console.log("warn: scope not found", blockType, identText, identPos)
    }

    let identKind = declarationContextTypeToIdentifierKind[blockType]
      ?? IdentifierKind.Unknown
    if (identKind === IdentifierKind.Unknown) {
      const prev = this.peekBlock(1)
      identKind = declarationGroupContextTypeToIdentifierKind[prev.type] ?? IdentifierKind.Unknown
    }
    let isEnum = blockType === SemanticContextType.EnumDecl

    // NOTE: Enum fields don't have types, their types are always -1
    const type = identifierKindToType[identKind]
      ?? block.metadata.fieldType
    // console.log("support shadowing: ", scopeSupportsShadowing.get(scope.type)?.has(identKind), scope.type, identKind)
    const hasCount = !isEnum && (scope
      ? scopeSupportsShadowing.get(scope.type)?.has(identKind)
        ? scope.metadata.identifierCounts.get(identText) > 0
        : this.context.identifierStack.getLength(identText) > 0
      : this.context.identifierStack.getLength(identText) > 0)

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
      // case SemanticContextType.RecordDecl: {
      //   this.context.currentRecordIdent.push(identText)
      //   // block.metadata.identifier = identText
      //   break
      // }
      case SemanticContextType.FnDecl: {
        this.context.actionTable.push(ActionKind.Function, identText, {
          action: identText,
          kind: ActionKind.Function,
          signatures: block.metadata.signatures
        })
        fnSignature = block.metadata.signatures[0]
        // block.metadata.identifier = identText
        break
      }

      // case SemanticContextType.FnParamsDecl: {
      //   block.metadata.currentIdentifier = identText
      //   break
      // }

      // case SemanticContextType.LetDecl:
      // case SemanticContextType.FnParamsDecl:
      // case SemanticContextType.TransDecl:
      // case SemanticContextType.StateDecl:
      // case SemanticContextType.InvariantDecl:
      // case SemanticContextType.LocalVariableGroup:
      // case SemanticContextType.GlobalConstantGroup:
      // case SemanticContextType.GlobalVariableGroup:
      // case SemanticContextType.RecordVariableDeclGroup: {
      //   block.metadata.identifier = identText
      //   break
      // }

      case SemanticContextType.EnumDecl: {
        this.context.enumFields.add(identText)
        break
      }
    }

    if (declarationContextType.has(blockType)) {
      block.metadata.identifier = identText
    }

    // this.context.editorCtx.pushScopeLayerIdent(identText, type, identPos, identKind, blockType, this.context.scopedBlocks.length)

    const payload = {
      text: identText,
      type,
      position: identPos,
      kind: identKind,
      blockType
    }

    this.emit("lang:identifier:register", payload)
    this.emitLangComponent(context, payload)

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
      const isRecordMemberDef = scope.type === SemanticContextType.RecordScope
        // current block is not enum decl
        // (since enum decl also involves identifiers)
        && this.peekBlock().type !== SemanticContextType.EnumDecl


        // this.findNearestBlock(SemanticContextType.EnumDecl, SemanticContextType.RecordScope) === null
        // && this.searchNearestBlock(
        //   block => block.metadata?.blockCurrentRecord === true,
        //   SemanticContextType.RecordScope,
        //   // this.context.blockContextStack.length - scope.index
        // ) === null
      if (isRecordMemberDef) {
        const recordDecl = this.findNearestBlock(SemanticContextType.RecordDecl)
        const recordIdent = recordDecl.metadata.identifier // this.context.currentRecordIdent[this.context.currentRecordIdent.length - 1]
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

    let errParams = {
      desc: "identifier",
      ident: identText
    }
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
          const functionDecl = this.findNearestBlock(SemanticContextType.FnDecl)
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

        break
      }
    }

    const whereBlock = this.findNearestBlock(SemanticContextType.WhereExpr)
    if (whereBlock) {
      const variableDeclBlock = this.findNearestBlock(SemanticContextType.VariableDecl)
      if (variableDeclBlock) {
        const ident = variableDeclBlock.metadata.identifier
        if (ident !== identText && this.context.identifierStack.peek(identText)?.kind !== IdentifierKind.GlobalConst) {
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

    if (shouldPushTypeStack) {
      this.pushTypeStack(ident?.type ?? IdentifierType.Hole)
    }

    if (es.length) {
      this.emit("errors", es)
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

    const ident = this.context.identifierStack.peek(parentIdentText)

    const hasRecord = ident && ident.kind === IdentifierKind.Record // this.context.identifierCounts.hasCounts([IdentifierKind.Record], parentIdentText)
    if (!hasRecord) {
      es.push({
        source: ErrorSource.Semantic,
        ...parentPos,

        type: ErrorType.UndefinedIdentifier,
        params: {desc: "record", ident: parentIdentText}
      })
    }

    const hasRecordField = hasRecord && this.context.recordFieldStack.getLength(parentIdentText, identText) > 0 // this.context.recordCounts.hasCounts([parentIdentText], identText)
    if (!hasRecordField) {
      es.push({
        source: ErrorSource.Semantic,
        ...identPos,

        type: ErrorType.UndefinedIdentifier,
        params: {desc: "record field", ident: `${parentIdentText}.${identText}`}
      })
      this.pushTypeStack(IdentifierType.Hole)
    } else {
      const recordField = this.context.recordFieldStack.peek(parentIdentText, identText)
      this.pushTypeStack(recordField.type)
    }

    if (es.length) {
      this.emit("errors", es)
    }

  }

  handleIdentifier(identifierText, identifierPos, context) {
    const block = this.peekBlock()
    if (!block) {
      console.log("warn: block type not found")
      return
    }

    const blockType = block.type
    if (declarationContextType.has(blockType)) {
      this.registerIdentifier(block, identifierText, identifierPos, context)
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
      ?? IdentifierType.Hole

    switch (block.type) {
      case SemanticContextType.FnDecl: {
        block.metadata.signatures[0].output = type
        break
      }

      case SemanticContextType.FnParamsDecl: {
        const fnBlock = this.findNearestBlock(SemanticContextType.FnDecl)
        if (fnBlock) {
          fnBlock.metadata.signatures[0].input.push(type)
          const currentIdentText = block.metadata.identifier
          const currentIdent = this.context.identifierStack.peek(currentIdentText)
          if (currentIdent) {
            currentIdent.type = type
            // block.metadata.currentIdentifier = null
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

      default: {
        if (singleTypedDeclarationGroupContextType.has(block.type)) {
          // case SemanticContextType.EnumGroup:
          // case SemanticContextType.GlobalConstantGroup:
          // case SemanticContextType.GlobalVariableGroup:
          // case SemanticContextType.LocalVariableGroup:
          block.metadata.fieldType = type
        }

        break

        // if (singleTypedDeclarationContextType.has(block.type)) {
        //   // case SemanticContextType.RecordVariableDeclGroup:
        //   if (type === IdentifierType.Hole) {
        //     console.log("warn: unknown type text", typeText)
        //   }
        //   block.metadata.fieldType = type
        //   break
        // }

      }
    }
  }

  handleFunCall(actionKind) {
    const block = this.peekBlock()
    const position = block.position
    if (this.findNearestBlock(SemanticContextType.WhereExpr)) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.WhereFunctionCall
      }])
    }
    this.deduceActionCall(actionKind, block.metadata.fnName, block.metadata.gotParams, position)
  }

  deduceActionCall(actionKind, action, inputActualLength, position) {
    const fn = this.context.actionTable.peek(actionKind, action)
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
        const types = this.context.typeStack.slice(0 - inputActualLength)
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
      popMulti(this.context.typeStack, inputActualLength)
    } else {
      const currentTypesOrdered = popMultiStore(this.context.typeStack, inputActualLength).reverse()
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

  resetTypeStack() {
    if (this.context.typeStack.length) {
      this.context.typeStack = []
    }
  }

  pushTypeStack(type) {
    this.context.typeStack.push(type)
  }

  deduceVariableDecl() {
    const block = this.peekBlock()
    const pos = block.position
    const ident = block.metadata.identifier
    const identInfo = this.context.identifierStack.peek(ident)

    if (!identInfo) {
      console.log("warn: invalid identifier when exit variableDecl", block)
      return
    }

    const type = this.context.typeStack.pop() // int a = 1;
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
    const actualType = this.context.typeStack.pop()
    const isCorrect = actualType === type
      || actualType === IdentifierType.Hole
      || (allowNull && actualType == null)

    if (pushType != null) {
      this.pushTypeStack(pushType)
    }

    if (!isCorrect) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...(position ?? this.peekBlock().position),

        type: ErrorType.TypeMismatchExpr,
        params: {expected: [type], got: [actualType]}
      }])
    }
  }

  deduceToMultiTypes(types, position, pushType = null, pushSelf = false) {
    const actualType = this.context.typeStack.pop()
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
    const actualTypes = this.context.typeStack
    const isCorrect = (atLeast === 0 && actualTypes.length === 0)
      || (
        actualTypes.length >= atLeast
        && actualTypes.every(actualType =>
          actualType === type
          || actualType === IdentifierType.Hole
        )
      )

    if (pushType != null) {
      this.context.typeStack = [pushType]
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
    const scope = this.latestNthScope()
    if (!scope) {
      console.log("warn: use of initial without scope")
      return false
    }

    return allowedScopes.includes(scope.type)
  }

  checkOption(optName, lit, context) {
    const position = this.peekBlock().position
    this.emitLangComponent(context, {name: optName, value: lit})

    const opt = optionAcceptableValues.get(optName)
    if (!opt) {
      return
    }

    if (this.context.definedOptions.has(optName)) {
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

    this.context.definedOptions.add(optName)

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
        params: {
          ident: "fresh",
          scopes
        }
      }])
    }
  }

  handleStateDecl(attrs) {
    const block = this.peekBlock()
    const position = block.position

    const es = []
    const identifier = block.metadata.identifier
    if (attrs.isStart) {
      const machine = this.currentMachineBlock()
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

    if (attrs.isAbstract && block.metadata.hasChildren === true) {
      es.push({
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.CodeInsideAbstractNode,
      })
    }

    if (es.length) {
      this.emit("errors", es)
    }
    this.context.stateSet.add(identifier)
    this.emit("lang:state", {identifier, attrs, position})
  }

  handleStateScope(hasStatement) {
    this.peekBlock().metadata.hasChildren = hasStatement
  }

  handleGoal() {
    const block = this.peekBlock()
    this.currentMachineBlock().metadata.goalDefined = true
    this.emit("lang:goal", block)
  }

  handleMachineDeclEnter(keyword, keywordPosition, context) {
    const block = this.peekBlock()
    block.metadata.keywordPosition = keywordPosition
    this.emitLangComponent(context, {keyword})
  }

  handleMachineDeclExit() {
    const block = this.peekBlock()
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

    this.emit("finished")
  }

  handleReturn(position) {
    const scope = this.findNearestScope(SemanticContextType.FnBodyScope)

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

    const decl = this.findNearestBlock(SemanticContextType.FnDecl)
    if (!decl) {
      console.log("warn: unknown function declaration", position)
      return
    }

    const type = this.context.typeStack.pop() ?? IdentifierType.Hole
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
    const scope = this.latestNthScope()
    if (scope && scope.type === SemanticContextType.FnBodyScope && scope.metadata.isReturned) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,

        type: ErrorType.StatementAfterReturn
      }])
    }
  }

  handleStatementExit(position) {
    const type = this.context.typeStack[this.context.typeStack.length - 1]
    if (type != null && type !== IdentifierType.Hole && type !== IdentifierType.Bool) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,
        params: {got: type},

        type: ErrorType.InvalidStatement
      }])
    }
  }

  handleTransExclusion(idents) {
    const transDecl = this.findNearestBlock(SemanticContextType.TransDecl).metadata
    for (let id of idents) {
      transDecl.excludedStates.add(id)
    }

    // block.metadata.exclusionFlag = isEnter
  }

  handleTransOp(op) {
    this.findNearestBlock(SemanticContextType.TransDecl).metadata.operators.add(op)
  }

  handleTransToStates(idents) {
    for (let id of idents) {
      this.findNearestBlock(SemanticContextType.TransDecl).metadata.toStates.add(id)
    }
  }

  handleTransLabel(label) {
    this.findNearestBlock(SemanticContextType.TransDecl).metadata.label = label.slice(1, label.length - 1).trim()
  }

  handleWhereExpr(expr, ctx) {
    const transBlock = this.findNearestBlock(SemanticContextType.TransDecl)

    // const block = this.peekBlock(1)

    if (transBlock) {
      transBlock.metadata.whereExpr = expr
        .slice("where ".length)
        .replace(/(?:\r\n|\r|\n)/g, " ")
        .replace(/\s\s+/g, " ")
    }

    this.emitLangComponent(ctx, {expr})
  }

  handleTrans(expr) {
    const block = this.peekBlock()
    const position = block.position
    const md = block.metadata
    const {fromState, toStates, operators, excludedStates} = md
    const es = []

    if (!md.whereExpr) {
      const label = `${fromState ?? ""}|${[...toStates].sort().join(",")}|${[...operators].sort().join(",")}|${[...excludedStates].sort().join(",")}`
      if (this.context.transitionSet.has(label)) {
        es.push({
          source: ErrorSource.Semantic,
          ...position,
          type: ErrorType.DuplicatedEdge
        })
      } else {
        this.context.transitionSet.add(label)
      }
    }

    const targetStates = new Set(toStates)
    if (!toStates.size) {
      const isExcludeSelf = operators.has("+")
      for (let state of this.context.stateSet) {
        if (!(isExcludeSelf && state === fromState) && !excludedStates.has(state)) {
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

    this.emit("lang:transition", {metadata: md, targetStates, position, expr})
  }

  handleTransScope(ident) {
    if (ident) {
      this.findNearestBlock(SemanticContextType.TransDecl).metadata.fromState = ident
    } else {
      console.trace("warn: start state not found for trans")
    }
  }

  handleInExpr(identifiers, expr, position) {
    if (identifiers?.length) {
      const assertionBlock = this.findNearestBlock(SemanticContextType.AssertExpr)
      if (assertionBlock) {
        this.emit("lang:assertion:states", {expr, position, identifiers})
      } else {
        const invariantBlock = this.findNearestBlock(SemanticContextType.InvariantDecl)
        if (invariantBlock) {
          const name = invariantBlock.metadata.identifier
          this.emit("lang:invariant:states", {name, identifiers})
        }
      }
    }
  }

  handleStopExpr(identifiers) {
    const def = this.latestNthScope()
    if (identifiers?.length) {
      for (let id of identifiers) {
        def.metadata.states.add(id)
      }
    }
  }

  handleWithExpr(identifiers) {
    const def = this.latestNthScope()
    if (identifiers?.length) {
      for (let id of identifiers) {
        def.metadata.invariants.add(id)
      }
    }
  }

  handleCheckExpr(expr, context) {
    // this.latestNthScope().metadata.keyword = keyword
    const goal = this.latestNthScope()
    goal.metadata.expr = expr
    goal.metadata.finalPosition = this.peekBlock().position

    this.emitLangComponent(context, {
      expr
    })
  }

  handleExpression() {
    const block = this.peekBlock()
    if (block.type === SemanticContextType.FnCall) {
      block.metadata.gotParams += 1
    }
  }

  handlePathCondAssign(position) {
    this.deduceToType(IdentifierType.Bool, position)
    const decl = this.findNearestBlock(SemanticContextType.LetDecl)
    if (decl) {
      decl.metadata.hasBody = true
    }
  }

  handleLetExpr() {
    const block = this.peekBlock()
    const position = block.position
    this.deduceToType(IdentifierType.Bool, position, null, true)
    if (block.type === SemanticContextType.LetDecl && !block.metadata.hasBody) {
      this.emit("errors", [{
        source: ErrorSource.Semantic,
        ...position,
        type: ErrorType.LetBodyUndefined
      }])
    } else if (block.type !== SemanticContextType.LetDecl) {
      console.log("warn: let block not found")
    }
  }

  handleVariableInit(context) {
    this.emitLangComponent(context, null)
  }

  handleFunctionDecl(context) {
    const block = this.peekBlock()
    this.emitLangComponent(context, block.metadata)
  }

  registerTypeForVariableDecl() {
    const prevBlock = this.peekBlock(1)
    if (singleTypedDeclarationGroupContextType.has(prevBlock.type)) {
      this.peekBlock().metadata.fieldType = prevBlock.metadata.fieldType
    }
  }
}