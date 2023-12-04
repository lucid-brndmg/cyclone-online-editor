import {isWarning} from "@/core/specification";

export const getErrorLevel = (monaco, type) => {
  if (isWarning(type)) {
    return monaco.MarkerSeverity.Warning
  }

  return monaco.MarkerSeverity.Error
}