import {PositionTable} from "@/lib/storage";
import {OutlineKind, SemanticContextType} from "@/core/definitions";
import {declarationContextType, scopedContextType} from "@/core/specification";
import {getParentExpression} from "@/core/utils/antlr";

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
    this.scopeLayers.push({layer, outlineKind: OutlineKind.Group, type, position})
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
      if (state !== fromState) {
        this.registerTransInState(state, identifier, expr)
      }
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

  makeMachineSnapshot(context, block) {
    const machineCtx = context.currentMachineBlock?.metadata
    if (!machineCtx) {
      return
    }
    const enums = machineCtx.enumFields
    const identifiers = machineCtx.identifierStack
    this.setSortIdentifier(block.position, {
      type: block.type,
      identifiers: identifiers.extractLatestToMap(ident => ident.text),
      enums: new Set(enums)
    })
  }

  // execute this BEFORE ready
  attach(analyzer) {

    const fmtContextType = {}
    Object.entries(SemanticContextType).forEach(([key, value]) => {
      fmtContextType[value] = key
    })

    analyzer.on("block:enter", (context, {block}) => {
      if (scopedContextType.has(block.type)) {
        this.pushScopeLayerScope(context.scopeLength, block.type, block.position)
      }
      const path = context.currentBlockPath
      console.log(path.map(it => fmtContextType[it]).join("."))
    })

    analyzer.on("block:exit", (context, {payload, block}) => {
      if (scopedContextType.has(block.type)) {
        this.makeMachineSnapshot(context, block)
      }
      switch (block.type) {
        case SemanticContextType.StateDecl: {
          const {metadata, position} = block
          const {identifier, attributes} = metadata
          this.stateTable.set(identifier, {identifier, attrs: attributes, position, trans: 0, namedTrans: new Set(), exprList: []})
          break
        }
        case SemanticContextType.TransDecl: {
          const {metadata, position} = block
          const expr = payload.start.getInputStream().getText(payload.start.start, payload.stop.stop)
          this.defineTransition(
            metadata.identifier,
            metadata.label,
            metadata.whereExpr,
            metadata.fromState,
            metadata.operators,
            metadata.involvedStates,
            position,
            expr
          )
          break
        }

        case SemanticContextType.InExpr: {
          const {metadata, position} = block
          const {identifiers} = metadata
          if (!metadata.identifiers?.length) {
            break
          }

          const prev = context.peekBlock(1)
          switch (prev?.type) {
            case SemanticContextType.AssertExpr: {
              const expr = getParentExpression(payload)
              this.assertions.push({expr, position, identifiers})
              break
            }
            case SemanticContextType.InvariantDecl: {
              // -3 = invariant decl
              const name = prev.metadata.identifier
              this.invariants.push({name, identifiers})
              break
            }
          }
          break
        }

        case SemanticContextType.GoalScope: {
          const md = block.metadata
          if (md.invariants.size || md.states.size) {
            this.goal = {
              invariants: new Set(md.invariants),
              states: new Set(md.states),
              expr: md.expr,
              // position: block.position,
              finalPosition: md.finalPosition
            }
          }
        }
      }
    })

    analyzer.on("identifier:register", (context, {text, type, position, kind, blockType}) => {
      this.pushScopeLayerIdent(text, type, position, kind, blockType, context.scopeLength)
    })
  }
}