import spec from "../../resource/cyclone_spec.json"
import cycloneAnalyzer from "cyclone-analyzer";
import {ExtendedErrorType} from "@/core/definitions";


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
  ExtendedErrorType.NoStartNodeDefined,
  ExtendedErrorType.NoGoalDefined,
  ExtendedErrorType.DuplicatedEdge,
  ExtendedErrorType.CodeInsideAbstractNode,
  ExtendedErrorType.EmptyEdge,
  ExtendedErrorType.DuplicatedEnumField,
  ExtendedErrorType.DuplicatedEdgeTarget,
  ExtendedErrorType.OptionTraceNotFound,
  ExtendedErrorType.DuplicatedCheckForPathLength,
  ExtendedErrorType.NoFinalStateOrReachSpecified,
  ExtendedErrorType.UnreachableCheckForPathLength,

])

const errorTypeInfos = new Set([
  ExtendedErrorType.NodeUnconnected,
  ExtendedErrorType.IdentifierNeverUsed
])

export const isWarning = errorType => errorTypeWarnings.has(errorType)

export const isInfo = errorType => errorTypeInfos.has(errorType)
