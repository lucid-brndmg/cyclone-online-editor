import {CategorizedCountTable, CountTable} from "@/lib/storage";
import {IdentifierType} from "@/core/definitions";

export const scopeMetadata = () => ({
  // local count table, will be subbed when exit scope
  identifierCounts: new CountTable(),
  recordCounts: new CategorizedCountTable(),
  // fixedCoords
})

export const declareMetadata = () => ({
  type: IdentifierType.Unknown,
  identifier: null,
})

export const functionScopeMetadata = () => ({
  isReturned: false,
})

export const dotIdentifierExprMetadata = () => ({
  parent: null
})

export const functionDeclarationMetadata = () => ({
  // signatures: {
  //   input: [], // [[]]
  //   output: IdentifierType.Unknown
  // }

  signatures: [{
    input: [],
    output: IdentifierType.Unknown
  }]
})

export const enumDeclarationMetadata = () => ({
  blockCurrentRecord: true
})

export const functionParamsMetadata = () => ({
  currentIdentifier: null
})

export const functionCallMetadata = () => ({
  fnName: null,
  gotParams: 0, // if gotParams != signature.length then pop(gotParams); setError() else ()
})

export const stateDeclMetadata = () => ({
  hasChildren: false
})

export const transDeclMetadata = () => ({
  label: null,
  whereExpr: null,
  fromState: null,
  toStates: new Set(),
  operators: new Set(),
  excludedStates: new Set(),
  // exclusionFlag: false
})

export const goalScopeMetadata = () => ({
  invariants: new Set(),
  states: new Set(),
  expr: ""
})

export const recordBlockerFinder = block => {
  return block.metadata?.blockCurrentRecord === true
}