import antlr4 from "antlr4";
import {ErrorKind} from "@/core/definitions";
import {pos} from "@/lib/position";

export class SyntaxErrorListener extends antlr4.error.ErrorListener {
  source
  onError

  constructor(onError, source) {
    super();
    this.onError = onError
    this.source = source
  }

  syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
    this.onError({
      source: this.source,
      kind: ErrorKind.SyntaxError,
      startPosition: pos(line, column),
      msg
    })
  }
}