import {
  ErrorSource,
  ErrorType,
  IdentifierKind,
  IdentifierType,
  SemanticContextType
} from "@/core/definitions";

const errorTypeDescription = {
  // [ErrorKind.SyntaxError]: "Syntax Error",
  // [ErrorKind.TypeError]: "Type Error",
  // [ErrorKind.SemanticError]: "Semantic Error",
  // [ErrorKind.SemanticWarning]: "Semantic Warning",
  // [ErrorKind.UndefinedIdentifier]: "Undefined Identifier",
  // [ErrorKind.RedeclaredIdentifier]: "Redeclared Identifier"

  [ErrorType.SyntaxError]: "Syntax Error",

  [ErrorType.UndefinedIdentifier]: "Undefined Identifier",
  [ErrorType.IdentifierRedeclaration]: "Identifier Redeclaration",
  [ErrorType.RecursiveFunction]: "Invalid Function",
  [ErrorType.WhereFreeVariable]: "Invalid Where Condition",
  [ErrorType.WhereFunctionCall]: "Invalid Where Condition",
  [ErrorType.CompilerOptionDuplicated]: "Invalid Compiler Option",
  [ErrorType.StartNodeDuplicated]: "Invalid Node Modifier",
  [ErrorType.ReturnExprViolation]: "Invalid Statement",
  [ErrorType.StatementAfterReturn]: "Invalid Statement",
  [ErrorType.InvalidNamedExprScope]: "Invalid Expression",

  [ErrorType.TypeMismatchFunction]: "Type Mismatch",
  [ErrorType.TypeMismatchReturn]: "Type Mismatch",
  [ErrorType.TypeMismatchCompilerOption]: "Type Mismatch",
  [ErrorType.TypeMismatchVarDecl]: "Type Mismatch",
  [ErrorType.TypeMismatchVarRef]: "Type Mismatch",
  [ErrorType.TypeMismatchExpr]: "Type Mismatch",

  [ErrorType.CodeInsideAbstractNode]: "Redundant Code",
  [ErrorType.NoGoalDefined]: "Ill-Formed Graph",
  [ErrorType.NoStartNodeDefined]: "Ill-Formed Graph",
  [ErrorType.DuplicatedEdge]: "Redundant Edge",
  [ErrorType.EmptyEdge]: "Empty Edge",

  [ErrorType.RemoteError]: "Remote Execution Error"
}

export const formatErrorDescription = (type) => {
  return errorTypeDescription[type] ?? "Error"
}

const errorSourceToText = {
  [ErrorSource.Semantic]: "Semantic Error",
  [ErrorSource.Remote]: "Execution Error",
  [ErrorSource.Lexer]: "Syntax Error",
  [ErrorSource.Parser]: "Syntax Error"
}

const eMsgBased = ({msg}) => {
  return msg
}

const eUndefinedIdentifier = ({desc, ident}) => {
  return `use of undefined ${desc} '${ident}'`
}

const eIdentifierRedeclaration = ({ident}) => {
  return `redeclaration of identifier '${ident}'`
}

const eTypeMismatchVarRef = ({ident, expected}) => {
  return `type mismatch: ${ident} expected to have type ${formatType(expected)}`
}

const eRecursiveFunction = ({ident}) => {
  return `recursion function call to '${ident}' is not allowed in Cyclone`
}

const eWhereFreeVariable = ({ident, freeVariable}) => {
  return `variable '${freeVariable}' is not allowed in '${ident}'s where condition`
}

const eWhereFunctionCall = () => {
  return `functions cannot be used inside 'where' clauses`
}

const eTypeMismatchFunction = ({ident, got, expected}) => {
  return `type mismatch on function ${ident}, got: ${formatTypes(got)}, expected types are: ${formatSignatureInputs(expected)}`
}

const eTypeMismatchVarDecl = ({ident, expected, got}) => {
  return `type mismatch when declaring variable '${ident}', expected ${formatType(expected)}, got ${formatType(got)}`
}

const eTypeMismatchExpr = ({expected, got, minLength}) => {
  const hasMinLength = minLength != null
  const minLengthMsg = hasMinLength ? ` at least ${minLength}` : ""
  const expectedMsg = hasMinLength
    ? `(...${formatType(expected[0])})`
    : expected.length > 1 ? formatTypes(expected) : formatType(expected[0])

  return `type mismatch: expecting${minLengthMsg} ${expectedMsg}, got ${got.length > 1 ? formatTypes(got) : formatType(got[0])}`
}

const eCompilerOptionDuplicated = ({ident}) => {
  return `compiler option '${ident}' has already be defined`
}

const eTypeMismatchCompilerOption = ({ident, expected, desc}) => {
  return `option ${ident} could only accept ${desc ? desc : `the following value: ${expected.join(", ")}`}`
}

const eInvalidNamedExprScope = ({ident, scopes}) => {
  return `expression '${ident}' can only be used inside ${scopes.map(s => formatScopeBlockType(s)).join(" or ")} scope, and not in constant definitions`
}

const eStartNodeDuplicated = ({ident}) => {
  return `start state already defined as ${ident}, only 1 start state could exist in current graph`
}

const eCodeInsideAbstractNode = () => {
  return `code inside abstract node / state will be ignored by the compiler`
}

const eNoGoalDefined = () => {
  return `no goal defined in current graph`
}

const eNoStartNodeDefined = () => {
  return `no start node / state defined in current graph`
}

const eReturnExprViolation = () => {
  return `'return' expression can only be used inside function body`
}

const eTypeMismatchReturn = ({expected, got}) => {
  return `type mismatch on function return, expected to return ${formatType(expected)}, got ${formatType(got)}`
}

const eStatementAfterReturn = () => {
  return `unreachable code: statement after 'return'`
}

const eDuplicatedEdge = () => {
  return `duplicated non-conditional edge definition`
}

const eEmptyEdge = () => {
  return `this edge has no actual targeted state / node because every node is excluded`
}

const errorMessageFormatter = {
  [ErrorType.RemoteError]: eMsgBased,
  [ErrorType.SyntaxError]: eMsgBased,
  [ErrorType.UndefinedIdentifier]: eUndefinedIdentifier,
  [ErrorType.IdentifierRedeclaration]: eIdentifierRedeclaration,
  [ErrorType.RecursiveFunction]: eRecursiveFunction,
  [ErrorType.WhereFreeVariable]: eWhereFreeVariable,
  [ErrorType.WhereFunctionCall]: eWhereFunctionCall,
  [ErrorType.CompilerOptionDuplicated]: eCompilerOptionDuplicated,
  [ErrorType.StartNodeDuplicated]: eStartNodeDuplicated,
  [ErrorType.ReturnExprViolation]: eReturnExprViolation,
  [ErrorType.StatementAfterReturn]: eStatementAfterReturn,
  [ErrorType.InvalidNamedExprScope]: eInvalidNamedExprScope,
  [ErrorType.TypeMismatchFunction]: eTypeMismatchFunction,
  [ErrorType.TypeMismatchReturn]: eTypeMismatchReturn,
  [ErrorType.TypeMismatchCompilerOption]: eTypeMismatchCompilerOption,
  [ErrorType.TypeMismatchVarDecl]: eTypeMismatchVarDecl,
  [ErrorType.TypeMismatchVarRef]: eTypeMismatchVarRef,
  [ErrorType.TypeMismatchExpr]: eTypeMismatchExpr,
  [ErrorType.CodeInsideAbstractNode]: eCodeInsideAbstractNode,
  [ErrorType.NoGoalDefined]: eNoGoalDefined,
  [ErrorType.NoStartNodeDefined]: eNoStartNodeDefined,
  [ErrorType.DuplicatedEdge]: eDuplicatedEdge,
  [ErrorType.EmptyEdge]: eEmptyEdge,
}

export const formatErrorMessage = (type, params, source) => {
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

const typeMsgRepr = {
  [IdentifierType.Machine]: "machine",
  [IdentifierType.State]: "state",
  [IdentifierType.Trans]: "trans",
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
  [IdentifierKind.State]: "state / node",
  [IdentifierKind.Machine]: "machine / graph",
  [IdentifierKind.Trans]: "transition / edge",
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

export const formatType = (t, fallback = null) => typeMsgRepr[t] ?? (fallback || "(undefined type)")

export const formatTypes = types => types.length ? `(${types.map(t => formatType(t)).join(", ")})` : `(no-parameter)`

export const formatSignatureInputs = signatures => signatures
  .map(({input}) => formatTypes(input))
  .join(" | ")

export const formatRepeatedTypes = (type, times) => formatTypes(new Array(times).fill(type))

export const cycloneCodeMD = code => "```cyclone\n" +
  code +
  "\n```"

const scopeBlockTypeRepr = {
  [SemanticContextType.ProgramScope]: "program",
  [SemanticContextType.MachineScope]: "machine",
  [SemanticContextType.StateScope]: "state",
  [SemanticContextType.TransScope]: "trans",
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
  const ellipses = (max && allNamed.length > max)
  return {
    text: `${trans} edges involved: ${(max ? allNamed.slice(0, max).join(", ") : allNamed.join(", "))}${ellipses ? " ..." : ""}${hasAnon ? ` (${trans - allNamed.length} unnamed)` : ""}`,
    named: allNamed
  }
}