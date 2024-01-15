const GraphicalBlockKind = {

}

export default class GraphicalBlockBuilder {
  context

  constructor() {
    this.context = {
      blocks: [],
      latestBlocks: new Map(),
      ids: {
        compilerOption: 0,
        machine: 0,
        state: 0,
        transition: 0,
        assertion: 0,
        variable: 0,
        func: 0,
        final: 0,
        invariant: 0,
        statement: 0,
        pathVariable: 0,
        pathStatement: 0
      }
    }
  }

  #onAnalyzerBlockEnter(context, {block}) {

  }

  #onAnalyzerBlockExit(context, {block}) {

  }

  #onAnalyzerIdentifierRegister(context, {text}) {

  }

  #onAnalyzerIdentifierReference(context, references) {

  }

  attach(analyzer) {
    analyzer.on("")
  }


}