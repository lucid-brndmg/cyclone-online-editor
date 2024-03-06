export const isCycloneExecutableCode = code => /(machine|graph)\s+(\w)+\s*\{/.test(code)

export const isGraphviz = code => /digraph\s+\w*\s+\{\s*/gm.test(code)