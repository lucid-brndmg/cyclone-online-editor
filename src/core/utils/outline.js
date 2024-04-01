import cycloneAnalyzer from "cyclone-analyzer";

const {IdentifierKind, SemanticContextType, IdentifierType, SyntaxBlockKind} = cycloneAnalyzer.language.definitions

// "expand" a group of variables: int a, b, c
// to int a; int b; int c;
export const eliminateVarGroup = (block, parentBlock) => {
  switch (block.kind) {
    case SyntaxBlockKind.FnParamGroup:
    case SyntaxBlockKind.SingleTypedVariableGroup: {
      parentBlock.children.push(...block.children)
      return null
    }
    default: {
      const copy = {...block, children: []}
      for (let child of block.children) {
        const el = eliminateVarGroup(child, copy)
        const append = el != null
        if (append) {
          copy.children.push(el)
        }
      }
      return copy
    }
  }
}

// modified from https://stackoverflow.com/questions/45289854/how-to-effectively-filter-tree-view-retaining-its-existing-structure by Nina Scholz
export function filterText(root, finder) {
  let count = 0

  const getNodes = (result, object) => {
    // object.text?.startsWith(text)
    if (finder(object)) {
      const copy = {...object, isSearched: true}
      // object.isSearched = true
      result.push(copy);
      count += 1
      return result;
    }
    if (Array.isArray(object.children)) {
      const children = object.children.reduce(getNodes, []);
      if (children.length) result.push({ ...object, children });
    }
    return result;
  };

  const copy = {...root}
  copy.children = root.children.reduce(getNodes, [])

  return {
    result: copy,
    count
  };
}