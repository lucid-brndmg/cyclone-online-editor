// Is the string a Cyclone program?
export const isCycloneExecutableCode = code => /(machine|graph)\s+(\w)+\s*\{/.test(code)

// Is the string a Graphviz instance?
export const isGraphviz = code => /digraph\s+\w*\s+\{\s*/gm.test(code)