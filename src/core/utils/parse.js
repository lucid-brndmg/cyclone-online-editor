import {SyntaxErrorListener} from "@/core/utils/syntax";
import cycloneAnalyzer from "cyclone-analyzer";
import {ErrorSource} from "@/core/definitions";

export const parseCycloneSyntax = ({input, onError}) => {
  const lexerErrorListener = new SyntaxErrorListener(onError, ErrorSource.Lexer)
  const parserErrorListener = new SyntaxErrorListener(onError, ErrorSource.Parser)

  return cycloneAnalyzer.utils.antlr.parseCycloneSyntax({input, lexerErrorListener, parserErrorListener})

  // const stream = new antlr4.InputStream(input)
  // const lexer = new CycloneLexer(stream)
  // lexer.removeErrorListeners()
  // lexer.addErrorListener(new SyntaxErrorListener(onError, ErrorSource.Lexer))
  //
  // const tokens = new antlr4.CommonTokenStream(lexer)
  // const parser = new CycloneParser(tokens)
  // parser.removeErrorListeners()
  // parser.addErrorListener(new SyntaxErrorListener(onError, ErrorSource.Parser))
  //
  // const tree = parser.program()
  //
  // return {
  //   tree,
  //   syntaxErrorsCount: parser.syntaxErrorsCount,
  // }
}