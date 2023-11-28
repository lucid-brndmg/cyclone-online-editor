import {PositionTable} from "@/lib/storage";
import {OutlineKind} from "@/core/definitions";

export default class EditorSemanticContext {
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

    analyzer.on("state", (context, {identifier, attributes}) => {
      this.defineState(identifier, attributes)
    })

    analyzer.on("edge", (context, block) => {
      const md = block.metadata
      this.defineTransition(
        md.identifier,
        md.label,
        md.whereExpr,
        md.fromState,
        md.toStates,
        md.operators,
        md.excludedStates
      )
    })
  }
}