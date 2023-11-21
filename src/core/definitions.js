export const ErrorSource = {
  Lexer: 0,
  Parser: 1,
  Semantic: 2,
  Remote: 3
}

export const ErrorKind = {
  // UndefinedVariable: 0, // undefined = ??
  // UndefinedEnumField: 1, // #undefined
  // UndefinedState: 2,
  //
  // UndefinedIdentifier: 98, // other undefined values
  //
  // TypeError: 99 // TBD

  SyntaxError: 1,
  UndefinedIdentifier: 2,
  RedeclaredIdentifier: 3,
  TypeError: 4,
  SemanticWarning: 5,
  SemanticError: 6,
  Remote: 7
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

  GlobalConstantDecl: 120, // decl

  EnumDecl: 130, // decl

  GlobalVariableDecl: 140, // decl
  LocalVariableDecl: 141, // decl
  RecordVariableDecl: 142, // decl

  // VariableInit: 150, // ref
  // VariableWhere: 151,

  Expression: 150, // REF

  InExpr: 160, // ref

  // Assert: 160, // ref

  FnDecl: 170, // decl (whole function)
  FnBodyScope: 172, // scope (body part of the function)
  FnParamsDecl: 173, // decl
  FnCall: 174, // ref

  Primary: 180, // ref

  AnnotationDecl: 190, // decl

  DotExpr: 200,

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

  Unknown: -1, // fallback
  Hole: -2, // not expected to show to user yet
}

export const ActionKind = {
  InfixOperator: 0, // a x b
  PrefixOperator: 1, // a x
  SuffixOperator: 2, // x a
  Function: 3, // x(a)
}

export const OutlineKind = {
  Scope: 1,
  Identifier: 2
}