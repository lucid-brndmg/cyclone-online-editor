import tutorialManifest from "../../../resource/tutorial_manifest.json";

export const tutorialTable = (() => {
  const result = {}

  for (let item of tutorialManifest) {
    result[item.id] = item
  }

  return result
})()