export const ErrorSource = {
  Lexer: 0,
  Parser: 1,
  Semantic: 2,
  Remote: 3
}

export const ErrorType = {
  SyntaxError: 1001,

  UndefinedIdentifier: 2001,
  IdentifierRedeclaration: 2002,
  RecursiveFunction: 2003,
  WhereFreeVariable: 2004,
  WhereFunctionCall: 2005,
  CompilerOptionDuplicated: 2006,
  StartNodeDuplicated: 2007,
  ReturnExprViolation: 2008,
  StatementAfterReturn: 2009,
  InvalidNamedExprScope: 2010,
  InvalidStatement: 2011,
  LetBodyUndefined: 2012,

  TypeMismatchFunction: 3001,
  TypeMismatchReturn: 3002,
  TypeMismatchCompilerOption: 3003,
  TypeMismatchVarDecl: 3004,
  TypeMismatchVarRef: 3005,
  TypeMismatchExpr: 3006,

  CodeInsideAbstractNode: 4001,
  NoGoalDefined: 4002,
  NoStartNodeDefined: 4003,
  DuplicatedEdge: 4004,
  EmptyEdge: 4005,

  RemoteError: 5001,

}

// enter: push block type
// check:
//   declaration: mark variable name, checkReDecl
//   assign: if (name in definedSet && (stack |> popN) = [Assign, ..., Machine, Program]) then OK else error
// exit: pop block type
export const SemanticContextType = {
  ProgramScope: 0,

  MachineDecl: 10, // decl, scope
  MachineScope: 11,
  // MachineScope: 11,

  StateDecl: 20, // decl, stateExpr
  StateScope: 21, // scope

  TransDecl: 30, // decl
  TransScope: 31, // ref, scope

  InvariantDecl: 40, // decl
  InvariantScope: 41, // ref, scope

  GoalScope: 50, // ref, scope

  Stop: 60, // ref

  With: 70, // ref

  LetDecl: 80, // decl

  StateInc: 90, // ref

  PathPrimary: 100, // ref

  RecordDecl: 110, // decl
  RecordScope: 111, // scope

  VariableDecl: 120,
  GlobalConstantGroup: 121, // decl
  GlobalVariableGroup: 122, // decl
  LocalVariableGroup: 123, // decl

  EnumDecl: 130, // decl

  // Although it is NOT A GROUP for now
  // the analyzer would treat it as a group in case for future updates, etc
  RecordVariableDeclGroup: 140, // decl

  WhereExpr: 150,

  // VariableInit: 150, // ref
  // VariableWhere: 151,

  // Expression: 150, // REF

  InExpr: 160, // ref

  // Assert: 160, // ref

  FnDecl: 170, // decl (whole function)
  FnBodyScope: 172, // scope (body part of the function)
  FnParamsDecl: 173, // decl
  FnCall: 174, // ref

  // Primary: 180, // ref

  AnnotationDecl: 190, // decl

  DotExpr: 200,

  AssertExpr: 210,

  CompilerOption: 220,

  // variants of expr
  VariableInit: 230,
  Statement: 231,

  // check for / check each / ...
  GoalFinal: 240,

  PathAssignStatement: 250 // should get identifier via regex

  // PathCondition: 210,

}

export const IdentifierKind = {
  // Enum: 0,
  // Record: 2,
  // State: 3,
  // Variable: 4,
  // LetVariable: 5,
  Machine: 0,
  State: 1,
  Trans: 2,
  Let: 3,
  Record: 4,
  GlobalConst: 5,
  EnumField: 6,
  GlobalVariable: 7,
  LocalVariable: 8,
  FnName: 9,
  FnParam: 10,
  Annotation: 11,

  Invariant: 12,
  RecordField: 13,

  Unknown: -1
}

export const IdentifierType = {
  Machine: 0,
  State: 1,
  Trans: 2,
  Record: 4,
  Enum: 5,
  Function: 6,
  Invariant: 7,

  Int: 8,
  String: 9,
  Char: 10,
  Real: 11,
  Bool: 12,

  // Unknown: -2, // fallback
  Hole: -1, // not expected to show to user yet
}

export const ActionKind = {
  InfixOperator: 0, // a x b
  PrefixOperator: 1, // x a
  SuffixOperator: 2, // a x
  Function: 3, // x(a)
}

export const OutlineKind = {
  Group: 1,
  Identifier: 2
}
