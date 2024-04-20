import {positionComparator, posRangeIncludes} from "@/lib/position";
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

    this.context.sort(positionComparator)
  }

  find(line, column) {
    // TODO: optimize this using binary search

    // const candidates = this.context.filter(pair => posRangeIncludes({line, column}, pair) )
    // return candidates[candidates.length - 1]

    return this.context.findLast(pair => posRangeIncludes({line, column}, pair))
  }
}

// class PropertyLocator {
//   context = []
//
//   constructor(enums, identifiers) {
//   }
// }

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
  compilerOptions = new Map()

  constructor(isBuildSyntaxBlocks = false) {
    this.isBuildSyntaxBlocks = isBuildSyntaxBlocks
  }

  // identifierCoordsTable = new FixedCoordinateTable()

  findAvailableIdentifiers(line, col) {
    return this.scopePosition.find(line, col)
  }

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
  defineTransition(metadata, position, expr) {
    const {identifier, fromState, involvedStates} = metadata
    this.transitions.push({
      targetStates: involvedStates,
      ...metadata,
      position,
    })
    if (identifier) {
      this.namedTransitions.set(identifier, involvedStates)
    }
    for (let state of involvedStates) {
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
    const enums = machineCtx.enumFields.keys()
    const identifiers = machineCtx.identifierStack.copy()
    this.scopePosition.set(block.position, {
      type: block.type,
      identifiers,// : identifiers.extractLatestToMap(ident => ident.text),
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
          // this.defineTransition(
          //   metadata.identifier,
          //   metadata.label,
          //   metadata.whereExpr,
          //   metadata.fromState,
          //   metadata.operators,
          //   metadata.involvedStates,
          //   position,
          //   expr,
          //   metadata.labelKeyword
          // )

          this.defineTransition(
            metadata,
            position,
            expr,
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
          break
        }

        case SemanticContextType.CompilerOption: {
          const {
            name, value
          } = block.metadata
          this.compilerOptions.set(name, value)
          break
        }
      }
    })

    // analyzer.on("identifier:register", (context, {text, type, position, kind, blockType}) => {
    //   this.pushScopeLayerIdent(text, type, position, kind, blockType, context.scopeLength)
    // })
  }
}