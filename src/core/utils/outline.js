import cycloneAnalyzer from "cyclone-analyzer";

const {IdentifierKind, SemanticContextType, IdentifierType, SyntaxBlockKind} = cycloneAnalyzer.language.definitions

// const sanitizeScopeLayers = layers => {
//   let result = []
//   let currentLayer = null
//   let enums = []
//   let enumLayers = []
//   for (let i = 0; i < layers.length; i++) {
//     const layer = layers[i]
//
//     switch (layer.outlineKind) {
//       case OutlineKind.Identifier: {
//         if (
//           ![
//             IdentifierKind.FnName,
//             IdentifierKind.State,
//             IdentifierKind.Record,
//             IdentifierKind.Trans,
//             IdentifierKind.Invariant,
//             IdentifierKind.Machine,
//             IdentifierKind.EnumField,
//
//             IdentifierKind.GlobalConst,
//             IdentifierKind.GlobalVariable,
//             IdentifierKind.LocalVariable,
//             IdentifierKind.RecordField
//           ].includes(layer.kind)
//         ) {
//           result.push(layer)
//         } else if ([
//             IdentifierKind.GlobalConst,
//             IdentifierKind.GlobalVariable,
//             IdentifierKind.LocalVariable,
//             IdentifierKind.RecordField
//           ].includes(layer.kind)) {
//           if (layer.type === IdentifierType.Enum) {
//             const enumLayerIdx = currentLayer.layer + 1
//             enumLayers.push({
//               layer: enumLayerIdx,
//               outlineKind: OutlineKind.Group,
//               type: SemanticContextType.EnumDecl,
//               position: layer.position,
//               text: layer.text
//             })
//             let j = i - 1
//             const currentEnums = []
//             while (layers[j] && layers[j].outlineKind === OutlineKind.Identifier && layers[j].kind === IdentifierKind.EnumField) {
//               // result.push(layers[j])
//               currentEnums.push({...layers[j], currentLayer: enumLayerIdx})
//               j --
//             }
//             enums.push(currentEnums)
//           } else {
//             result.push(layer)
//           }
//         }
//         break
//       }
//
//       case OutlineKind.Group: {
//         if (enumLayers.length) {
//           for (let j = 0; j < enumLayers.length; j++) {
//             const enumLayer = enumLayers[j]
//             const enumDefs = enums[j]
//             result.push(enumLayer)
//             result.push(...enumDefs.reverse())
//           }
//           enums = []
//           enumLayers = []
//         }
//         if (pairIncludes([
//           [SemanticContextType.FnBodyScope, SemanticContextType.FnDecl],
//           [SemanticContextType.StateScope, SemanticContextType.StateDecl],
//           [SemanticContextType.RecordScope, SemanticContextType.RecordDecl],
//           [SemanticContextType.TransScope, SemanticContextType.TransDecl],
//           [SemanticContextType.InvariantScope, SemanticContextType.InvariantDecl],
//           [SemanticContextType.MachineScope, SemanticContextType.MachineDecl]
//         ], [layer.type, layers[i - 1]?.blockType])) {
//           layer.text = layers[i - 1].text
//           // identifierPos?
//         }
//         currentLayer = layer
//         result.push(layer)
//       }
//     }
//   }
//
//   return result
// }
//
// export const scopeLayersToOutline = (layers) => {
//   if (!layers.length) {
//     return null
//   }
//
//   const [root, ...sanitized] = sanitizeScopeLayers(layers)
//
//   root.children = []
//
//   let parent = root
//   let currLayer = root.layer
//   const tbl = {
//     [root.layer]: root
//   }
//
//   for (let layer of sanitized) {
//     switch (layer.outlineKind) {
//       case OutlineKind.Group: {
//         currLayer = layer.layer
//         layer.children = []
//         if (currLayer <= parent.layer) {
//           parent = tbl[currLayer - 1]
//           parent.children.push(layer)
//         } else {
//           tbl[currLayer - 1].children.push(layer)
//           tbl[currLayer] = layer
//         }
//         break
//       }
//
//       case OutlineKind.Identifier: {
//         // tbl[currLayer].children.push(layer)
//         tbl[layer.currentLayer].children.push(layer)
//         break
//       }
//     }
//   }
//
//   return root
// }

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