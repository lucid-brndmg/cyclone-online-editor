import antlr4 from "antlr4";
import CycloneLexer from "@/generated/antlr/CycloneLexer";
import {SyntaxErrorListener} from "@/core/antlr/syntax";
import {ErrorSource} from "@/core/definitions";
import CycloneParser from "@/generated/antlr/CycloneParser";

export const parseCycloneSyntax = ({input, onError}) => {
  const stream = new antlr4.InputStream(input)
  const lexer = new CycloneLexer(stream)
  lexer.removeErrorListeners()
  lexer.addErrorListener(new SyntaxErrorListener(onError, ErrorSource.Lexer))

  const tokens = new antlr4.CommonTokenStream(lexer)
  const parser = new CycloneParser(tokens)
  parser.removeErrorListeners()
  parser.addErrorListener(new SyntaxErrorListener(onError, ErrorSource.Parser))

  const tree = parser.program()

  return {
    tree,
    syntaxErrorsCount: parser.syntaxErrorsCount,
  }
}