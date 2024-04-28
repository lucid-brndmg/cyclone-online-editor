import cycloneAnalyzer from "cyclone-analyzer";
import {ErrorSource, ExtendedErrorType} from "@/core/definitions";

const {
  IdentifierKind,
  IdentifierType,
  SemanticContextType
} = cycloneAnalyzer.language.definitions

const {
  literalBounds
} = cycloneAnalyzer.language.specifications

const {typeToString} = cycloneAnalyzer.utils.type

// const errorTypeDescription = {
//   // [ErrorKind.SyntaxError]: "Syntax Error",
//   // [ErrorKind.TypeError]: "Type Error",
//   // [ErrorKind.SemanticError]: "Semantic Error",
//   // [ErrorKind.SemanticWarning]: "Semantic Warning",
//   // [ErrorKind.UndefinedIdentifier]: "Undefined Identifier",
//   // [ErrorKind.RedeclaredIdentifier]: "Redeclared Identifier"
//
//   [ExtendedErrorType.SyntaxError]: "Syntax Error",
//
//   [ExtendedErrorType.UndefinedIdentifier]: "Undefined Identifier",
//   [ExtendedErrorType.IdentifierRedeclaration]: "Identifier Redeclaration",
//   [ExtendedErrorType.RecursiveFunction]: "Invalid Function",
//   [ExtendedErrorType.WhereFreeVariable]: "Invalid Where Condition",
//   [ExtendedErrorType.WhereFunctionCall]: "Invalid Where Condition",
//   [ExtendedErrorType.CompilerOptionDuplicated]: "Invalid Compiler Option",
//   [ExtendedErrorType.StartNodeDuplicated]: "Invalid Node Modifier",
//   [ExtendedErrorType.ReturnExprViolation]: "Invalid Statement",
//   [ExtendedErrorType.StatementAfterReturn]: "Invalid Statement",
//   [ExtendedErrorType.InvalidNamedExprScope]: "Invalid Expression",
//   [ExtendedErrorType.InvalidStatement]: "Invalid Statement",
//   [ExtendedErrorType.LetBodyUndefined]: "Path Condition Undefined",
//   // [ErrorType.LocalVariableEnum]: "Enum Type In Local Variables",
//   [ExtendedErrorType.InvalidNodeModifier]: "Invalid Node Modifier",
//   [ExtendedErrorType.EnumNotAllowedInVariable]: "Enum Not Allowed Here",
//   [ExtendedErrorType.WhereInlineVariable]: "Where Clause In Local Variables",
//   [ExtendedErrorType.InvalidCheckForPathLength]: "Invalid Path Length",
//   [ExtendedErrorType.AnonymousEdgeIdentifier]: "Identifier On Anonymous Edge",
//   [ExtendedErrorType.AssertModifierInExpr]: "Invalid Assert Expression",
//
//   [ExtendedErrorType.TypeMismatchFunction]: "Type Mismatch",
//   [ExtendedErrorType.TypeMismatchReturn]: "Type Mismatch",
//   [ExtendedErrorType.TypeMismatchCompilerOption]: "Type Mismatch",
//   [ExtendedErrorType.TypeMismatchVarDecl]: "Type Mismatch",
//   [ExtendedErrorType.TypeMismatchVarRef]: "Type Mismatch",
//   [ExtendedErrorType.TypeMismatchExpr]: "Type Mismatch",
//
//   [ExtendedErrorType.CodeInsideAbstractNode]: "Redundant Code",
//   [ExtendedErrorType.NoGoalDefined]: "Ill-Formed Graph",
//   [ExtendedErrorType.NoStartNodeDefined]: "Ill-Formed Graph",
//   [ExtendedErrorType.DuplicatedEdge]: "Redundant Edge",
//   [ExtendedErrorType.EmptyEdge]: "Empty Edge",
//   [ExtendedErrorType.DuplicatedEnumField]: "Duplicated Enum",
//   [ExtendedErrorType.DuplicatedEdgeTarget]: "Duplicated Edge Target",
//   [ExtendedErrorType.OptionTraceNotFound]: "Option Output Ignored",
//   [ExtendedErrorType.DuplicatedCheckForPathLength]: "Duplicated Path Length",
//
//   [ExtendedErrorType.RemoteError]: "Remote Execution Error"
// }
//
// export const formatErrorDescription = (type) => {
//   return errorTypeDescription[type] ?? "Error"
// }

const errorSourceToText = {
  [ErrorSource.Semantic]: "Semantic Problem",
  [ErrorSource.Remote]: "Execution Error",
  [ErrorSource.Lexer]: "Syntax Error",
  [ErrorSource.Parser]: "Syntax Error"
}

const eMsgBased = ({msg}) => {
  return msg
}

const eUndefinedIdentifier = ({desc, ident}) => {
  return `no ${desc} '${ident}' is defined in current spec`
}

const eIdentifierRedeclaration = ({ident, recordIdent, kind}) => {
  const id = recordIdent ? `${recordIdent}.${ident}` : ident
  return `'${id}' is already defined previously`
}

const eRecursiveFunction = ({ident}) => {
  return `recursive function call to '${ident}' is not allowed in Cyclone`
}

const eWhereFreeVariable = ({ident, freeVariable}) => {
  return `variable '${freeVariable}' is not allowed in '${ident}'s where condition`
}

const eWhereFunctionCall = () => {
  return `functions cannot be used inside 'where' clauses`
}

const eTypeMismatchFunction = ({ident, got, expected}) => {
  const isIdentifier = /\w+/.test(ident)
  return `type mismatch on ${isIdentifier ? "function" : "operator"} ${ident}: ${formatTypes(got)}, expected types are: ${formatSignatureInputs(expected)}`
}

const eTypeMismatchVarDecl = ({ident, expected, got}) => {
  return `type mismatch when declaring variable '${ident}', expected ${formatType(expected)}, defined ${formatType(got)}`
}

const eTypeMismatchExpr = ({expected, got, minLength}) => {
  const hasMinLength = minLength != null
  const minLengthMsg = hasMinLength ? ` at least ${minLength}` : ""
  const expectedMsg = hasMinLength
    ? `(...${formatType(expected[0])})`
    : expected.length > 1 ? formatTypes(expected) : formatType(expected[0])

  return `type mismatch: expecting${minLengthMsg} ${expectedMsg}, received ${got.length > 1 ? formatTypes(got) : formatType(got[0])}`
}

const eCompilerOptionDuplicated = ({ident}) => {
  return `compiler option '${ident}' has already be defined`
}

const eTypeMismatchCompilerOption = ({ident, expected, desc}) => {
  return `option ${ident} could only accept ${desc ? desc : `the following value: ${expected.join(", ")}`}`
}

const eInvalidNamedExprScope = ({ident, scopes}) => {
  return `expression '${ident}' can only be used inside scopes: ${scopes.map(s => formatScopeBlockType(s)).join(" | ")} and not in constant definitions`
}

const eStartNodeDuplicated = ({ident}) => {
  return `start node already defined as ${ident}, only 1 start node could exist in current graph`
}

const eCodeInsideAbstractNode = () => {
  return `code inside abstract node will be ignored by the compiler`
}

const eNoGoalDefined = () => {
  return `no goal is defined in current graph`
}

const eNoStartNodeDefined = () => {
  return `no start node is defined in current graph`
}

const eReturnExprViolation = ({isOutOfFunction, isOutOfStatement}) => {
  if (isOutOfFunction) {
    return `'return' expression can only define at the end of function body`
  }
  return `'return' keyword must be defined at the beginning of a statement`
}

const eTypeMismatchReturn = ({expected, got}) => {
  return `type mismatch on return expression, function expected to return ${formatType(expected)}, returned ${formatType(got)}`
}

const eStatementAfterReturn = () => {
  return `unreachable code: statement after 'return'`
}

const eDuplicatedEdge = () => {
  return `duplicated non-conditional edge definition`
}

const eEmptyEdge = () => {
  return `this edge has no actual targeted node because every node is excluded`
}

const eInvalidStatement = ({got}) => {
  return `invalid statement: expecting this statement to return nothing or bool, but returned ${formatType(got)}`
}

const eLetBodyUndefined = () => {
  return `path expression not defined in a path variable. Expecting a concrete definition. For example: let path_var = S0->S1;`
}

const eDuplicatedEnumField = ({text}) => {
  return `duplicated enum definition: ${text}`
}

const eDuplicatedEdgeTarget = ({identifier}) => {
  return `duplicated edge target: ${identifier}`
}

const eInvalidNodeModifier = ({combination, duplication}) => {
  return combination
    ? `invalid node modifier combination: "${combination.join(" + ")}"`
    : `duplicated node modifiers: ${duplication.join(", ")}`
}

const eEnumNotAllowedInVariable = () => {
  return `enums can not be defined inside constants / functions`
}

const eWhereInlineVariable = () => {
  return `where clause can not be applied to local variables`
}

const eOptionTraceNotFound = () => {
  return `option-trace not enabled. Hence option-output has no effect.`
}

const eInvalidCheckForPathLength = ({text}) => {
  return `invalid path length. path length should be greater than 0, received ${text}`
}

const eDuplicatedCheckForPathLength = ({text}) => {
  return `duplicated path length: ${text}`
}

const eAnonymousEdgeIdentifier = () => {
  return `an anonymous edge can not have name`
}

const eAssertModifierInExpr = () => {
  return `assertion qualifier 'some | always' can not be used with 'in' clause. Please remove 'in' clause or remove qualifier`
}

const eInvalidValueMutation = ({ident, action}) => {
  if (ident) {
    return `constant '${ident}' can not be operated via operator '${action}'`
  }
  return `this expression can not be used together with value mutation operators: '${action}'`
}

const eOperatingDifferentEnumSources = ({lhs, rhs}) => {
  if (!lhs || !rhs) {
    return `enum values are defined in different sources, which can not be operated together.`
  }
  const l = [...lhs].slice(0, 3).join(", ") + (lhs?.size > 3 ? "..." : "")
  const r = [...rhs].slice(0, 3).join(", ") + (rhs?.size > 3 ? "..." : "")
  return `enum values '${l}' and '${r}' are defined in different sources, which can not be operated together.`
  // return `operating enum values from different sources is not allowed: ${l} and ${r}`
}

const eLiteralOutOfBoundary = ({type}) => {
  let bound
  const [lo, hi] = literalBounds[type]
  if (lo != null && hi != null) {
    bound = `Valid range is ${lo} to ${hi}`
  }
  return `${formatType(type)} value is out of range. ${bound}`
}

const eCheckUptoMultiLengths = ({length}) => {
  return `range mode (upto) can not specify multiple path lengths. expecting 1 length specified, received: ${length}`
}

const eInvalidCheckForModes = ({keywords}) => {
  return `enumeration does not support range mode: (upto | each), please use check`
}

const eNoFinalStateOrReachSpecified = () => {
  return `no final node or reach / stop clause specified in this graph`
}

const eUnreachableCheckForPathLength = ({length, unreachableLengths}) => {
  return `unreachable path length in check: specified ${unreachableLengths.join(", ")}. Maximum valid path length of this graph is: ${length}`
}

const eNodeUnconnected = () => {
  return `this node is not connected to any other node in this graph`
}

const errorMessageFormatter = {
  [ExtendedErrorType.RemoteError]: eMsgBased,
  [ExtendedErrorType.SyntaxError]: eMsgBased,
  [ExtendedErrorType.UndefinedIdentifier]: eUndefinedIdentifier,
  [ExtendedErrorType.IdentifierRedeclaration]: eIdentifierRedeclaration,
  [ExtendedErrorType.RecursiveFunction]: eRecursiveFunction,
  [ExtendedErrorType.WhereFreeVariable]: eWhereFreeVariable,
  [ExtendedErrorType.WhereFunctionCall]: eWhereFunctionCall,
  [ExtendedErrorType.CompilerOptionDuplicated]: eCompilerOptionDuplicated,
  [ExtendedErrorType.StartNodeDuplicated]: eStartNodeDuplicated,
  [ExtendedErrorType.ReturnExprViolation]: eReturnExprViolation,
  [ExtendedErrorType.StatementAfterReturn]: eStatementAfterReturn,
  [ExtendedErrorType.InvalidNamedExprScope]: eInvalidNamedExprScope,
  [ExtendedErrorType.TypeMismatchFunction]: eTypeMismatchFunction,
  [ExtendedErrorType.TypeMismatchReturn]: eTypeMismatchReturn,
  [ExtendedErrorType.TypeMismatchCompilerOption]: eTypeMismatchCompilerOption,
  [ExtendedErrorType.TypeMismatchVarDecl]: eTypeMismatchVarDecl,
  [ExtendedErrorType.TypeMismatchExpr]: eTypeMismatchExpr,
  [ExtendedErrorType.CodeInsideAbstractNode]: eCodeInsideAbstractNode,
  [ExtendedErrorType.NoGoalDefined]: eNoGoalDefined,
  [ExtendedErrorType.NoStartNodeDefined]: eNoStartNodeDefined,
  [ExtendedErrorType.DuplicatedEdge]: eDuplicatedEdge,
  [ExtendedErrorType.EmptyEdge]: eEmptyEdge,
  [ExtendedErrorType.InvalidStatement]: eInvalidStatement,
  [ExtendedErrorType.LetBodyUndefined]: eLetBodyUndefined,
  [ExtendedErrorType.DuplicatedEnumField]: eDuplicatedEnumField,
  [ExtendedErrorType.DuplicatedEdgeTarget]: eDuplicatedEdgeTarget,
  [ExtendedErrorType.InvalidNodeModifier]: eInvalidNodeModifier,
  [ExtendedErrorType.EnumNotAllowedInVariable]: eEnumNotAllowedInVariable,
  [ExtendedErrorType.WhereInlineVariable]: eWhereInlineVariable,
  [ExtendedErrorType.OptionTraceNotFound]: eOptionTraceNotFound,
  [ExtendedErrorType.InvalidCheckForPathLength]: eInvalidCheckForPathLength,
  [ExtendedErrorType.DuplicatedCheckForPathLength]: eDuplicatedCheckForPathLength,
  [ExtendedErrorType.AnonymousEdgeIdentifier]: eAnonymousEdgeIdentifier,
  [ExtendedErrorType.AssertModifierInExpr]: eAssertModifierInExpr,
  [ExtendedErrorType.InvalidValueMutation]: eInvalidValueMutation,
  [ExtendedErrorType.OperatingDifferentEnumSources]: eOperatingDifferentEnumSources,
  [ExtendedErrorType.LiteralOutOfBoundary]: eLiteralOutOfBoundary,
  [ExtendedErrorType.CheckUptoMultiLengths]: eCheckUptoMultiLengths,
  [ExtendedErrorType.InvalidCheckForModes]: eInvalidCheckForModes,
  [ExtendedErrorType.NoFinalStateOrReachSpecified]: eNoFinalStateOrReachSpecified,
  [ExtendedErrorType.UnreachableCheckForPathLength]: eUnreachableCheckForPathLength,
  [ExtendedErrorType.NodeUnconnected]: eNodeUnconnected
}

export const formatErrorMessage = (type, params, source = null) => {
  // switch (source) {
  //   case ErrorSource.Parser:
  //   case ErrorSource.Lexer: return `Syntax error: ${msg}`
  //
  //   case ErrorSource.Semantic:
  //   default: return msg;
  // }

  const pref = source ? `${errorSourceToText[source]}: ` : ""

  return `${pref}${errorMessageFormatter[type](params)}`
}

export const formatErrorSource = source => errorSourceToText[source]

const typeMsgRepr = {
  [IdentifierType.Machine]: "graph",
  [IdentifierType.State]: "node",
  [IdentifierType.Trans]: "edge",
  [IdentifierType.Record]: "record",
  [IdentifierType.Enum]: "enum",
  [IdentifierType.Function]: "function",
  [IdentifierType.Invariant]: "invariant",
  [IdentifierType.Int]: "int",
  [IdentifierType.String]: "string",
  [IdentifierType.Char]: "char",
  [IdentifierType.Real]: "real",
  [IdentifierType.Bool]: "bool",
  // [IdentifierType.Unknown]: "unknown_type", // void ???
  [IdentifierType.Hole]: "unknown"
}

const kindDescription = {
  [IdentifierKind.State]: "node / state",
  [IdentifierKind.Machine]: "graph / machine",
  [IdentifierKind.Trans]: "edge / transition",
  [IdentifierKind.Invariant]: "invariant",
  [IdentifierKind.Let]: "path variable",
  [IdentifierKind.Record]: "record",
  [IdentifierKind.RecordField]: "record field",
  [IdentifierKind.EnumField]: "enum literal",
  [IdentifierKind.GlobalConst]: "global constant",
  [IdentifierKind.GlobalVariable]: "global variable",
  [IdentifierKind.LocalVariable]: "local variable",
  [IdentifierKind.FnName]: "function",
  [IdentifierKind.FnParam]: "function parameter",
  [IdentifierKind.Annotation]: "annotation",
  [IdentifierKind.Unknown]: "unknown source"
}

export const formatKindDescription = k => kindDescription[k] ?? "unknown"

const formatFunctionIdent = ident => {
  const params = []
  const fnParams = ident.fnParams
  const fnSigns = ident.fnSignature

  if (fnParams.length && fnParams.length === ident.fnSignature.input.length) {
    for (let i = 0; i < fnParams.length; i++) {
      params.push(`${fnParams[i]}:${formatType(fnSigns.input[i])}`)
    }
  }

  return `function ${ident.text}: ${formatType(ident.fnSignature.output)} (${params.join(", ")})`
}

export const formatIdentifier = ident => {
  const identText = ident.text

  switch (ident.kind) {
    case IdentifierKind.Record: return `record ${identText} { ${ident.recordChild.map(({text, type}) => `${formatType(type)} ${text}`).join(", ")} }`
    case IdentifierKind.FnName: return formatFunctionIdent(ident)
    case IdentifierKind.EnumField: return `enum #${identText}`
    case IdentifierKind.Let: return `let ${identText}`
    case IdentifierKind.GlobalConst: return `const ${formatType(ident.type)} ${identText}`
    case IdentifierKind.Annotation: return `@${identText}`
  }

  return `${formatType(ident.type)} ${identText}`
}

export const formatType = (t) => typeToString(t)

export const formatTypes = types => types.length ? `(${types.map(t => formatType(t)).join(", ")})` : `(no-parameter)`

export const formatSignatureInputs = signatures => signatures
  .map(({input}) => formatTypes(input))
  .join(" | ")

export const cycloneCodeMD = code => "```cyclone\n" +
  code +
  "\n```"

const scopeBlockTypeRepr = {
  [SemanticContextType.ProgramScope]: "program",
  [SemanticContextType.MachineScope]: "graph",
  [SemanticContextType.StateScope]: "node",
  [SemanticContextType.TransScope]: "edge",
  [SemanticContextType.InvariantScope]: "invariant",
  [SemanticContextType.GoalScope]: "goal",
  [SemanticContextType.RecordScope]: "record",
  [SemanticContextType.FnBodyScope]: "function",
  [SemanticContextType.EnumDecl]: "enum"
}

export const formatScopeBlockType = t => scopeBlockTypeRepr[t] ?? ""

export const formatStateTransRelation = ({trans, namedTrans}, max = 5) => {
  const allNamed = [...namedTrans]
  const hasAnon = allNamed.length < trans
  const ellipses = allNamed.length && ((max && allNamed.length > max) || hasAnon)
  let text = `connected by ${trans} edges`

  if (allNamed.length) {
    text += `: ${(max ? allNamed.slice(0, max).join(", ") : allNamed.join(", "))}${ellipses ? " ..." : ""}`
  }

  return {
    // text: `connected by ${trans} edges: ${(max ? allNamed.slice(0, max).join(", ") : allNamed.join(", "))}${ellipses ? " ..." : ""}`,
    text,
    named: allNamed
  }
}