import examples from "../../resource/code_example_manifest.json";

export const codeExampleTable = (() => {
  const result = {}

  for (let ex of examples) {
    result[ex.id] = ex
  }

  return result
})()