import {PositionTable} from "@/lib/storage";
import {OutlineKind} from "@/core/definitions";

export default class EditorSemanticContext {
  scopePosition = new PositionTable()
  scopeLayers = []
  stateTable = new Map()
  transitions = []
  assertions = []
  invariants = []
  namedTransitions = new Map()
  goal

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

  // defineState(identifier, attrs) {
  //   this.stateTable.set(identifier, {
  //     identifier,
  //     attrs,
  //   })
  // }

  registerTransInState(state, transIdent, expr) {
    if (this.stateTable.has(state)) {
      const stateCtx = this.stateTable.get(state)
      stateCtx.trans += 1
      stateCtx.exprList.push(expr)
      if (transIdent) {
        stateCtx.namedTrans.add(transIdent)
      }
    }
  }

  // operator: -> | <-> | * | +
  defineTransition(identifier, label, whereExpr, fromState, operators, targetStates, position, expr) {
    this.transitions.push({
      identifier,
      label,
      whereExpr,
      isBiWay: operators.has("<->"),
      targetStates,
      fromState,
      position
    })
    if (identifier) {
      this.namedTransitions.set(identifier, targetStates)
    }
    for (let state of targetStates) {
      this.registerTransInState(state, identifier, expr)
    }
    this.registerTransInState(fromState, identifier, expr)
  }

  findTransition(name) {
    return this.namedTransitions.get(name)
  }

  findState(name) {
    return this.stateTable.get(name)
  }

  getVisualData() {
    return {
      trans: this.transitions,
      states: this.stateTable,
      assertions: this.assertions,
      invariants: this.invariants,
      goal: this.goal
    }
  }

  // execute this BEFORE ready
  attach(analyzer) {
    analyzer.on("enterScope", (context, block) => {
      this.pushScopeLayerScope(context.scopedBlocks.length, block.type, block.position)
    })

    analyzer.on("exitScope", (context, block) => {
      this.setSortIdentifier(block.position, {
        type: block.type,
        identifiers: context.identifierStack.extractLatestToMap(ident => ident.text),
        enums: new Set(context.enumFields)
      })
    })

    analyzer.on("identifierReg", (context, {text, type, position, kind, blockType}) => {
      this.pushScopeLayerIdent(text, type, position, kind, blockType, context.scopedBlocks.length)
    })

    // analyzer.on("state", (context, {identifier, attributes}) => {
    //   this.defineState(identifier, attributes)
    // })

    analyzer.on("trans", (context, {metadata, targetStates, position, expr}) => {
      // const md = block.metadata
      this.defineTransition(
        metadata.identifier,
        metadata.label,
        metadata.whereExpr,
        metadata.fromState,
        metadata.operators,
        targetStates,
        position,
        expr
      )
    })

    analyzer.on("statesAssertion", (ctx, assertion) => {
      this.assertions.push(assertion)
    })

    analyzer.on("statesInvariant", (ctx, invariant) => {
      this.invariants.push(invariant)
    })

    analyzer.on("goal", (ctx, block) => {
      const md = block.metadata
      if (md.invariants.size || md.states.size) {
        this.goal = {
          invariants: md.invariants,
          states: md.states,
          expr: md.expr,
          position: block.position
        }
      }
    })

    analyzer.on("state", (ctx, {identifier, attrs, position}) => {
      this.stateTable.set(identifier, {identifier, attrs, position, trans: 0, namedTrans: new Set(), exprList: []})
    })

    // Don't need to listen to "state" cuz stateTable is already defined
  }
}