import {CategorizedCountTable, CategorizedStackTable, CountTable, StackedTable} from "@/lib/storage";
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
  // members: []
})

export const singleTypedDeclGroupMetadata = () => ({
  fieldType: IdentifierType.Hole
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
  expr: "",
  finalPosition: null
})

const letDeclMetadata = () => ({
  hasBody: false
})

const machineDeclMetadata = () => ({
  keywordPosition: null,
  startNodeIdentifier: null,
  goalDefined: false,
  enumFields: new Set(),
  stateSet: new Set(),
  transitionSet: new Set(),
  actionTable: new CategorizedStackTable(),
  identifierStack: new StackedTable(),
  recordFieldStack: new CategorizedStackTable()
})

export const semanticContextMetadataTable = {
  [SemanticContextType.FnBodyScope]: functionScopeMetadata,
  [SemanticContextType.DotExpr]: dotIdentifierExprMetadata,
  [SemanticContextType.FnDecl]: functionDeclarationMetadata,
  // [SemanticContextType.FnParamsDecl]: functionParamsMetadata,
  // [SemanticContextType.EnumDecl]: enumDeclarationMetadata,
  [SemanticContextType.StateDecl]: stateDeclMetadata,
  [SemanticContextType.TransDecl]: transDeclMetadata,
  [SemanticContextType.GoalScope]: goalScopeMetadata,
  [SemanticContextType.LetDecl]: letDeclMetadata,
  [SemanticContextType.FnCall]: functionCallMetadata,
  [SemanticContextType.MachineDecl]: machineDeclMetadata,
}