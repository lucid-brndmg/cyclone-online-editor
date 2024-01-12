import {CategorizedCountTable, CountTable} from "@/lib/storage";
import {IdentifierType, SemanticContextType} from "@/core/definitions";

export const scopeMetadata = () => ({
  // local count table, will be subbed when exit scope
  identifierCounts: new CountTable(),
  recordCounts: new CategorizedCountTable(),
  // fixedCoords
})

export const declareMetadata = () => ({
  fieldType: IdentifierType.Hole,
  identifier: null,
  members: []
})

/*
* ---
* Metadata structures for specific semantic context types
* ---
* */

const functionScopeMetadata = () => ({
  isReturned: false,
})

const dotIdentifierExprMetadata = () => ({
  parent: null
})

const functionDeclarationMetadata = () => ({
  // signatures: {
  //   input: [], // [[]]
  //   output: IdentifierType.Unknown
  // }

  signatures: [{
    input: [],
    output: IdentifierType.Hole
  }]
})

// const enumDeclarationMetadata = () => ({
//   blockCurrentRecord: true
// })

// const functionParamsMetadata = () => ({
//   currentIdentifier: null
// })

const functionCallMetadata = () => ({
  fnName: null,
  gotParams: 0, // if gotParams != signature.length then pop(gotParams); setError() else ()
})

const stateDeclMetadata = () => ({
  hasChildren: false
})

const transDeclMetadata = () => ({
  label: null,
  whereExpr: null,
  fromState: null,
  toStates: new Set(),
  operators: new Set(),
  excludedStates: new Set(),
  // exclusionFlag: false
})

const goalScopeMetadata = () => ({
  invariants: new Set(),
  states: new Set(),
  expr: ""
})

const letDeclMetadata = () => ({
  hasBody: false
})

const machineDeclMetadata = () => ({
  keywordPosition: null,
  startNodeIdentifier: null,
  goalDefined: false
})

// export const recordBlockerFinder = block => {
//   return block.metadata?.blockCurrentRecord === true
// }

export const semanticContextMetadataTable = {
  [SemanticContextType.FnBodyScope]: functionScopeMetadata,
  [SemanticContextType.DotExpr]: dotIdentifierExprMetadata,
  [SemanticContextType.FnDecl]: functionDeclarationMetadata,
  // [SemanticContextType.FnParamsDecl]: functionParamsMetadata,
  // [SemanticContextType.EnumMultiDecl]: enumDeclarationMetadata,
  [SemanticContextType.StateDecl]: stateDeclMetadata,
  [SemanticContextType.TransDecl]: transDeclMetadata,
  [SemanticContextType.GoalScope]: goalScopeMetadata,
  [SemanticContextType.LetDecl]: letDeclMetadata,
  [SemanticContextType.FnCall]: functionCallMetadata,
  [SemanticContextType.MachineDecl]: machineDeclMetadata
}