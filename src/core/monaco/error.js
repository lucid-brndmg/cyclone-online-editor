import {ErrorKind} from "@/core/definitions";

export const getErrorLevel = (monaco, kind) => {
  if (kind === ErrorKind.SemanticWarning) {
    return monaco.MarkerSeverity.Warning
  }

  return monaco.MarkerSeverity.Error
}