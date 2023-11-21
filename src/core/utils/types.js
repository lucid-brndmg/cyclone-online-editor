import {IdentifierType} from "@/core/definitions";

export const checkSignature = (expected, actual) => {
  if (expected.length !== actual.length) {
    return {passed: false, hole: false}
  }

  for (let i = 0; i < expected.length; i++) {
    if (actual[i] === IdentifierType.Hole) {
      return {passed: true, hole: true}
    }

    if (expected[i] !== actual[i]) {
      return {passed: false, hole: false}
    }
  }

  return {passed: true, hole: false}
}