import cycloneAnalyzer from "cyclone-analyzer";

export const ErrorSource = {
  Lexer: 1,
  Parser: 2,
  Semantic: 3,
  Remote: 4
}

export const ExtendedErrorType = {
  ...cycloneAnalyzer.language.definitions.SemanticErrorType,
  SyntaxError: 1001,
  RemoteError: 1002
}