import spec from "../../resource/cyclone_spec.json"
import cycloneAnalyzer from "cyclone-analyzer";

const {ErrorType} = cycloneAnalyzer.language.definitions

export const cycloneLiterals = spec.literals

export const cycloneTypes = spec.types

export const cycloneOptions = spec.options

export const cycloneKeywords = spec.keywords


export const cycloneFullKeywords = [
  ...cycloneLiterals,
  ...cycloneTypes,
  ...cycloneOptions,
  ...cycloneKeywords,
]

export const cycloneFullKeywordsSet = new Set(cycloneFullKeywords)

export const cycloneOperators = spec.operators

const errorTypeWarnings = new Set([
  ErrorType.NoStartNodeDefined,
  ErrorType.NoGoalDefined,
  ErrorType.DuplicatedEdge,
  ErrorType.CodeInsideAbstractNode,
  ErrorType.EmptyEdge,
  ErrorType.DuplicatedEnumField,
  ErrorType.DuplicatedEdgeTarget
])

export const isWarning = errorType => errorTypeWarnings.has(errorType)
