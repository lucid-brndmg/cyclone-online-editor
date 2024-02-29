import {posRangeIncludes} from "@/lib/position";
import cycloneAnalyzer from "cyclone-analyzer";

const {SemanticContextType} = cycloneAnalyzer.language.definitions
const {getParentExpression} = cycloneAnalyzer.utils.antlr
const {scopedContextType} = cycloneAnalyzer.language.specifications

class PositionTable {
  context = []

  set({startPosition, stopPosition}, value) {
    this.context.push({
      startPosition,
      stopPosition,
      value
    })

    // if (!this.context[x]) {
    //   this.context[x] = {}
    // }
    //
    // this.context[x][y] = value
  }

  find(line, column, filterFn = null) {
    // TODO: optimize this using binary search

    const candidates = this.context.filter(pair => posRangeIncludes({line, column}, pair) && (filterFn ? filterFn(pair.value) : true))
    return candidates[candidates.length - 1]
  }

  sort() {
    // SCOPES HAVE A SPECIAL FEATURE:
    // LET SCOPE A, B
    // IF A.START < B.START THEN A.STOP > B.STOP
    // THEY CAN ONLY BE NESTED, NEVER INTERSECTED

    this.context.sort((a, b) => {
      if (a.startPosition.line === b.startPosition.line) {
        return a.startPosition.column - b.startPosition.column
      } else {
        return a.startPosition.line - b.startPosition.line
      }
    })
  }
}

export default class EditorSemanticContext {
  scopePosition = new PositionTable()
  // scopeLayers = []
  stateTable = new Map()
  transitions = []
  assertions = []
  invariants = []
  namedTransitions = new Map()
  goal
  isBuildSyntaxBlocks = false
  syntaxBlockBuilder = null

  constructor(isBuildSyntaxBlocks = false) {
    this.isBuildSyntaxBlocks = isBuildSyntaxBlocks
  }

  // identifierCoordsTable = new FixedCoordinateTable()

  findAvailableIdentifiers(line, col, filter = null) {
    return this.scopePosition.find(line, col, filter)
  }

  setSortIdentifier(pos, value) {
    this.scopePosition.set(pos, value)
    this.scopePosition.sort()
  }

  // pushScopeLayerScope(layer, type, position) {
  //   this.scopeLayers.push({layer, outlineKind: OutlineKind.Group, type, position})
  // }
  //
  // pushScopeLayerIdent(text, type, position, kind, blockType, currentLayer) {
  //   this.scopeLayers.push({text, type, position, kind, blockType, outlineKind: OutlineKind.Identifier, currentLayer})
  // }

  // getScopeLayers() {
  //   return this.scopeLayers
  // }

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
  defineTransition(identifier, label, whereExpr, fromState, operators, targetStates, position, expr, labelKeyword) {
    this.transitions.push({
      identifier,
      label,
      whereExpr,
      isBiWay: operators.has("<->"),
      targetStates,
      fromState,
      position,
      labelKeyword
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

  getProgramBlock() {
    return this.syntaxBlockBuilder?.getProgramBlock()
  }

  // execute this BEFORE ready
  attach(analyzer) {

    if (this.isBuildSyntaxBlocks) {
      this.syntaxBlockBuilder = new cycloneAnalyzer.blockBuilder.SyntaxBlockBuilder()
      this.syntaxBlockBuilder.attach(analyzer)
    }

    // const fmtContextType = {}
    // Object.entries(SemanticContextType).forEach(([key, value]) => {
    //   fmtContextType[value] = key
    // })

    // analyzer.on("block:enter", (context, {block}) => {
    //   if (scopedContextType.has(block.type)) {
    //     this.pushScopeLayerScope(context.scopeLength, block.type, block.position)
    //   }
    //   // const path = context.currentBlockPath
    //   // console.log(path.map(it => fmtContextType[it]).join("."))
    // })

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
            expr,
            metadata.labelKeyword
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
          if (md.invariants.length || md.states.length) {
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

    // analyzer.on("identifier:register", (context, {text, type, position, kind, blockType}) => {
    //   this.pushScopeLayerIdent(text, type, position, kind, blockType, context.scopeLength)
    // })
  }
}