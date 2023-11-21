import {ErrorKind, IdentifierKind, IdentifierType, SemanticContextType} from "@/core/definitions";

const errorKindDescription = {
  [ErrorKind.SyntaxError]: "Syntax Error",
  [ErrorKind.TypeError]: "Type Error",
  [ErrorKind.SemanticError]: "Semantic Error",
  [ErrorKind.SemanticWarning]: "Semantic Warning",
  [ErrorKind.UndefinedIdentifier]: "Undefined Identifier",
  [ErrorKind.RedeclaredIdentifier]: "Redeclared Identifier"
}

export const formatErrorDescription = (kind) => {
  return errorKindDescription[kind] ?? "Error"
}

export const formatErrorMessage = (kind, msg) => {
  // switch (source) {
  //   case ErrorSource.Parser:
  //   case ErrorSource.Lexer: return `Syntax error: ${msg}`
  //
  //   case ErrorSource.Semantic:
  //   default: return msg;
  // }

  return `${errorKindDescription[kind] ?? "Error"}: ${msg}`
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
  [IdentifierType.Unknown]: "unknown_type", // void ???
  [IdentifierType.Hole]: "expecting_type"
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
  [SemanticContextType.EnumDecl]: "enum {...}"
}

export const formatScopeBlockType = t => scopeBlockTypeRepr[t] ?? ""