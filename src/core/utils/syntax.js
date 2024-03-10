import {pos} from "@/lib/position";
import cycloneAnalyzer from "cyclone-analyzer";
import {ExtendedErrorType} from "@/core/definitions";

export class SyntaxErrorListener extends cycloneAnalyzer.utils.antlr.ErrorListener {
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
      startPosition: pos(line, column),
      // msg,

      type: ExtendedErrorType.SyntaxError,
      params: {msg}
    })
  }
}