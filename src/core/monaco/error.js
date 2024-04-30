import {isInfo, isWarning} from "@/core/specification";

export const getErrorLevel = (monaco, type) => {
  if (isWarning(type)) {
    return monaco.MarkerSeverity.Warning
  }

  if (isInfo(type)) {
    return monaco.MarkerSeverity.Info
  }

  return monaco.MarkerSeverity.Error
}