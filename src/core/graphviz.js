import {map2elems} from "@/lib/list";

export const DisplayDirection = {
  Auto: "auto",
  LR: "LR",
  TB: "TB",
  RL: "RL",
  BT: "BT"
}

export const displayDirectionOptions = [
  {label: "Auto", value: DisplayDirection.Auto},
  {label: "Left To Right", value: DisplayDirection.LR},
  {label: "Top To Bottom", value: DisplayDirection.TB},
  {label: "Right To Left", value: DisplayDirection.RL},
  {label: "Bottom To Top", value: DisplayDirection.BT},
]

export const AnimationSpeed = {
  None: "none",
  Fast: "fast",
  Medium: "medium",
  Slow: "slow"
}

export const AnimationDuration = {
  [AnimationSpeed.Slow]: 1000,
  [AnimationSpeed.Medium]: 500,
  [AnimationSpeed.Fast]: 100
}

export const animationSpeedOptions = [
  {label: "No Animations", value: AnimationSpeed.None},
  {label: "Fast", value: AnimationSpeed.Fast},
  {label: "Medium", value: AnimationSpeed.Medium},
  {label: "Slow", value: AnimationSpeed.Slow}
]

const genGraphvizStatesDef = (states, options, resultPaths = null) => {
  const codePieces = []
  for (let {identifier, attrs} of states) {
    const {isAbstract, isNode, isFinal, isStart, isNormal} = attrs
    const labels = []
    if (isAbstract) {labels.push("abstract")}
    if (isNormal) {labels.push("normal")}
    if (isStart) {labels.push("start")}
    if (isFinal) {labels.push("final")}
    labels.push(isNode ? "node" : "state")
    const props = labels.join(" ")
    const color = resultPaths?.states.has(identifier)
      ? ", color=green, fontcolor=green"
      : ""
    codePieces.push(`// ${props} ${identifier}\n${identifier}[label="${identifier}${options.showStateProps ? `\\n[${props}]` : ""}"${color}];`)
  }

  return codePieces
}

const genAttrs = xs => xs.length ? `[${xs.join(", ")}]` : ""
const genUndefinedState = (s, opts) => `// WARNING: undefined state: ${s} \n${s}[fontcolor=red, label="${s}${opts.showStateProps ? "\\n[undefined]" : ""}"];\n`


export const availableGraphvizEngines = [
  "circo",
  "dot",
  "fdp",
  // "sfdp",
  "neato",
  "osage",
  "patchwork",
  "twopi"
]

export const graphvizForEditorOptions = {
  showStateProps: true,
  showLabelLiteral: true,
  showWhereExpr: true,
  paddingEdgeText: true
}

export const genGraphvizPreview = ({states, trans}, options, resultPaths = null) => {
  const previewOptions = options.preview
  const statesDef = genGraphvizStatesDef(states.values(), previewOptions, resultPaths)
  const transRelations = []
  const definedStates = new Set(states.keys())
  const resultEdgesDef = new Set(
    resultPaths
      ? map2elems(resultPaths.edge, (s1, s2) => `${s1},${s2}`)
      : []
  )
  // const definedTrans = new Map()
  for (let {
    identifier,
    label,
    whereExpr,
    fromState,
    toStates,
    operators,
    excludedStates
  } of trans) {
    if (!definedStates.has(fromState)) {
      statesDef.push(genUndefinedState(fromState, previewOptions))
      definedStates.add(fromState)
    }
    const targetStates = new Set(toStates)
    if (!toStates.size) {
      const isExcludeSelf = operators.has("+")
      // const isIncludeAll = operators.has("*")

      for (let state of states.keys()) {
        if (!(isExcludeSelf && state === fromState) && !excludedStates.has(state)) {
          targetStates.add(state)
        }
      }

      // const exclusions = new Set(excludedStates)
    }
    const transPieces = []
    for (let sTo of targetStates) {
      let attrs = []
      if (!definedStates.has(sTo)) {
        statesDef.push(genUndefinedState(sTo, previewOptions))
        definedStates.add(sTo)
      }

      const isBiWay = operators.has("<->")

      if (isBiWay) {
        attrs.push(`dir=both`)
      }
      if (resultEdgesDef.has(`${fromState},${sTo}`) || (isBiWay && resultEdgesDef.has(`${sTo},${fromState}`))) {
        attrs.push(`color=green`, `fontcolor=green`)
      }
      if (whereExpr) {
        attrs.push(`style=dashed`)
      }

      let descriptions = []
      if (identifier) {
        descriptions.push(identifier)
      }

      const showWhere = whereExpr && previewOptions.showWhereExpr
      const showLabel = previewOptions.showLabelLiteral
      if (showWhere && label) {
        const content = `where ${whereExpr}, ${showLabel ? "label: " : ""}${label}`
        descriptions.push(identifier
          ? `(${content})`
          : content
        )
      } else if (showWhere) {
        const content = `${showLabel ? "condition: " : ""}${whereExpr}`
        descriptions.push(identifier
          ? `(${content})`
          : content
        )
      } else if (label) {
        const content = `${showLabel ? "label: " : ""}${label}`
        descriptions.push(identifier
          ? `(${content})`
          : content
        )
      }

      if (descriptions.length) {
        attrs.push(`label=${JSON.stringify((previewOptions.paddingEdgeText ? [" ", ...descriptions, " "] : descriptions).join(" "))}`)
      } else if (previewOptions.paddingEdgeText) {
        attrs.push(`label=" "`)
      }
      transPieces.push(`${fromState} -> ${sTo}${genAttrs(attrs)};`)
    }
    if (transPieces.length) {
      transRelations.push(transPieces)
    }
  }
  const dir = options.direction === DisplayDirection.Auto
    ? (transRelations.length ? "TB" : "LR")
    : options.direction
  return `digraph {\n\nrankdir=${dir};\n${statesDef.join("\n")}\n\n${transRelations.map(t => t.join("\n")).join("\n")}\n\n}`
}

export const genGraphvizExecutionResultPaths = ({states, edges}, options) => {
  const codes = []
  // const hasOverall = edges.length > 1
  // const overall = hasOverall ? [] : null
  // const overallDir = options.direction === DisplayDirection.Auto
  //   ? "TB"
  //   : options.direction
  // const statePaths = new Map()

  // TODO: count states

  const dir = options.direction === DisplayDirection.Auto
    ? states.size <= 6 ? "LR" : "TB"
    : options.direction

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]

    const pieces = []
    // for (let state of edge) {
    //
    // }

    for (let j = 0; j < edge.length; j++) {
      const state = edge[j]
      const nextState = edge[j + 1]
      if (nextState) {
        pieces.push(`${state} -> ${nextState}[label=" ${j + 1} "];`)
      }

      // if (hasOverall) {
      //   if (statePaths.has(state)) {
      //     statePaths.get(state).add(i)
      //   } else {
      //     statePaths.set(state, new Set([i]))
      //   }
      // }
    }

    const joined = pieces.join("\n")

    // if (hasOverall) {
    //   overall.push(`${joined}[label=" p${i} "];`)
    // }
    codes.push(`digraph {\n\nrankdir=${dir};\n${joined}\n\n}`)
  }

  // let stateDef = ""
  // if (hasOverall) {
  //   const pieces = []
  //   for (let [state, indices] of statePaths) {
  //     pieces.push(`${state}[label="${state}\\n{${[...indices].map(i => `p${i}`).join(", ")}}"];`)
  //   }
  //
  //   stateDef = pieces.join("\n")
  // }
  // const overallCode = hasOverall
  //   ? `digraph {\n\nrankdir=${overallDir};\n\n${stateDef}\n\n${overall.join(`\n`)}\n\n}`
  //   : null

  return codes
}

// THE CODE FOR THE <table> ELEMENT'S STYLE COPIED FROM https://graphviz.org/Gallery/directed/psg.html
// OTHER PARTS ARE WRITTEN ON MY OWN
export const genGraphvizTrace = (traces, options) => {
  const codes = []

  for (let trace of traces) {
    const path = []
    const states = []
    let n = 1

    for (let {
      state,
      isAbstract,
      raw,
      fields
    } of trace) {
      const id = `s${n++}`
      path.push(id)
      const bg = fields.length ? "white" : "black"
      const label = `<table border="0" cellborder="0" cellpadding="3" bgcolor="${bg}"><tr><td bgcolor="black" align="center" colspan="2"><font color="white">${raw}</font></td></tr>${fields.map(({key, value}) => `<tr><td align="left" port="r1">${key} = ${value}</td></tr>`)}</table>`
      states.push(`${id}[style = "filled" penwidth = 1 fillcolor = "${bg}" fontname = "Courier New" shape = "Mrecord" label =<${label}>];`)
//       states.push(`${id} [color="black", style="rounded, filled" , fillcolor="orange" , shape="rect", label= <
//  \t\t <table border='0' cellborder='0' style='rounded'>
// \t\t\t <tr><td align="center" colspan="2" > <b>${raw}</b></td></tr>
// \t\t\t ${fields.map(({key, value}) => `<tr><td align="center">${key} :</td><td>${value}</td></tr>`).join("\n\t\t\t")}
// \t\t </table> > ]`)
    }

    const dir = options.direction === DisplayDirection.Auto
      ? path.length <= 6 ? "LR" : "TB"
      : options.direction

    codes.push(`digraph {\n\nrankdir=${dir};\n\n${states.join("\n")}\n\n${path.join("->")};\n\n}`)
  }

  return codes
}