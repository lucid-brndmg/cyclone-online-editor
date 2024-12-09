import {map2elems, searchIndices} from "@/lib/list";
import {dropRegex, dropRegexes} from "@/lib/string";
import cycloneAnalyzer from "cyclone-analyzer";

/*
* Module of converting Cyclone to DOT
* */

const {
  isAnonymousEdge
} = cycloneAnalyzer.utils.edge

const {
  replaceOperators
} = cycloneAnalyzer.blockBuilder.refactorHelper

const CycloneParser = cycloneAnalyzer.generated.antlr.CycloneParser

const exprOperatorReplacerMap = new Map([
  ["^", "⊕"], // xor
  ["&&", "∧"],
  ["||", "∨"],
  ["->", "→"],
  ["<->", "↔"],
  ["=>", "⇒"],
  ["!", "¬"],
  ["==", "="],
  ["!=", "≠"],
  ["<=", "≤"],
  [">=", "≥"],
  // ["*", "×"]
])

const operatorReplacerFn = (symbol, ctx, index) => {
  const text = symbol.text
  if ((ctx instanceof CycloneParser.StateIncExprContext || ctx instanceof CycloneParser.PathPrimaryExprContext) && text === "^") {
    return null
  }

  return exprOperatorReplacerMap.get(text)
}

const formatCycloneExpr = (code, entry) => replaceOperators(code, entry, null, operatorReplacerFn)

const CycloneParsingEntry = {
  Expr: "expression",
  Check: "checkExpr",
  Assert: "assertExpr",
}

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

const getNodeStyle = attrs => {
  const s = new Set(attrs)
  let color, isFinal = s.has("final"), isStart = s.has("start"), isAbstract = s.has("abstract")
  // const nodeAttrs = []

  if (isStart) {
    if (isAbstract) {
      color = "deepskyblue"
    } else {
      color = "pink"
    }
  } else if (isAbstract) {
    color = "springgreen"
  } else {
    color = "orange"
  }

  // nodeAttrs.push(`fillcolor=${color}`)
  // if (isFinal) {
  //   nodeAttrs.push(`peripheries=2`)
  // }

  return [color, isFinal, isStart]
}

const genGraphvizStatesDef = (states, options, resultPaths = null) => {
  const codePieces = []
  for (let {identifier, attrs} of states) {
    const [fill, isFinal, isStart] = getNodeStyle(attrs)
    const props = attrs.join(" ")
    const isResultMode = resultPaths != null
    let isResult = false, pathExpr = ''
    if (isResultMode) {
      isResult = resultPaths.states.has(identifier)
      const paths = searchIndices(resultPaths.edge, identifier, 1)
      if (paths.length) {
        pathExpr = `<br/><font >step ${paths.join(", ")}</font>`
      }
    }
    const shape = isFinal
      ? ", peripheries=2"
      : ""
    const label = `<${options.showNodeProps ? `<font ><i >${props}</i></font><br />` : ""} <font ${isResult ? `color="crimson"` : ""}><b>${identifier}</b></font> ${pathExpr}>`

    codePieces.push(`// ${props} ${identifier}\n${identifier}[label=${label}, style=filled, fillcolor=${fill}${shape}];`)
    if (isStart) {
      codePieces.push(`<start> -> ${identifier};`)
    }
  }

  return codePieces
}

const genAttrs = xs => xs.length ? `[${xs.join(", ")}]` : ""
const genUndefinedState = (s, opts) => `// WARNING: undefined node: ${s} \n${s}[fontcolor=red, label="${s}${opts.showNodeProps ? "\\n[undefined]" : ""}"];\n`

const genUndefinedInvariant = (s, opts) => `${s}[fontcolor=blue, color=blue, style=dashed, label="invariant ${s}${opts.showNodeProps ? "\\n[every node]" : ""}"];\n`

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
  showNodeProps: false,
  showLabelLiteral: false,
  // showWhereExpr: true,
  paddingEdgeText: true,

  showInvariant: true,
  showAssertion: true,
  showGoal: true,
  showDetailedExpressions: false,

  showAsMathOperators: true
}

export const genGraphvizTransDef = (definedStates, resultPaths, trans, statesDef, previewOptions) => {
  const transRelations = []
  const resultEdgesDef = new Set(
    resultPaths
      ? map2elems(resultPaths.edge, (s1, s2) => `${s1},${s2}`)
      : []
  )
  // const definedTrans = new Map()
  for (let t of trans) {
    const {
      identifier,
      label,
      whereExpr,
      fromState,
      // toStates,
      labelKeyword,
      involvedRelations
    } = t

    if (!definedStates.has(fromState)) {
      statesDef.push(genUndefinedState(fromState, previewOptions))
      definedStates.add(fromState)
    }
    const transPieces = []
    const isAnon = isAnonymousEdge(t)
    // const rawRelations = isAnon
    //   ? expandAnonymousEdge(t, [...definedStates])
    //   : [{source: fromState, target: toStates[0]}]
    const relations = []

    if (isAnon) {
      const s = new Map()
      for (let {source, target} of involvedRelations) {
        const e = [source, target].sort().join(":")
        if (s.has(e)) {
          s.get(e).isBi = true
        } else {
          s.set(e, {source, target, isBi: false})
        }
      }
      relations.push(...s.values())
    } else {
      relations.push(...involvedRelations)
    }
    for (let {source, target, isBi} of relations) {
      let attrs = []
      if (!definedStates.has(target)) {
        statesDef.push(genUndefinedState(target, previewOptions))
        definedStates.add(target)
      }

      if (isBi) {
        attrs.push(`dir=both`)
      }
      if (resultEdgesDef.has(`${source},${target}`) || (isBi && resultEdgesDef.has(`${target},${source}`))) {
        attrs.push(
          `color=red`,
          // `fontcolor=darkgreen`
        )
      }

      let descriptions = []
      if (identifier) {
        descriptions.push(identifier)
      }

      const showWhere = !!whereExpr // && previewOptions.showWhereExpr
      const showLabel = previewOptions.showLabelLiteral
      if (showWhere && label) {
        const replacedWhereExpr = previewOptions.showAsMathOperators ? formatCycloneExpr(whereExpr, CycloneParsingEntry.Expr) : whereExpr
        const content = `where ${replacedWhereExpr}, ${showLabel ? `${labelKeyword ?? "label"}: ` : ""}${label}`
        descriptions.push(identifier
          ? `(${content})`
          : content
        )
      } else if (showWhere) {
        const replacedWhereExpr = previewOptions.showAsMathOperators ? formatCycloneExpr(whereExpr, CycloneParsingEntry.Expr) : whereExpr
        const content = `${showLabel ? "condition: " : ""}${replacedWhereExpr}`
        descriptions.push(identifier
          ? `(${content})`
          : content
        )
      } else if (label) {
        const content = `${showLabel ? `${labelKeyword ?? "label"}: ` : ""}${label}`
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
      transPieces.push(`${source} -> ${target}${genAttrs(attrs)};`)
    }
    if (transPieces.length) {
      transRelations.push(transPieces)
    }
  }

  return transRelations
}

const genGraphvizInvariantsDef = (invariants, statesDef, definedStates, previewOptions) => {
  const def = []
  const definedInvariants = new Set()
  for (let inv of invariants) {
    const {identifier, identifiers} = inv
    statesDef.push(`${identifier}[label=" invariant ${identifier} ", style=dashed, fontcolor=blue, color=blue];`)
    definedInvariants.add(identifier)
    for (let ident of identifiers) {
      if (!definedStates.has(ident)) {
        statesDef.push(genUndefinedState(ident, previewOptions))
        definedStates.add(ident)
      }
      def.push(`${identifier} -> ${ident}[color=blue];`)
    }
  }

  return {
    definitions: def,
    defined: definedInvariants
  }
}

const genGraphvizAssertionsDef = (assertions, statesDef, definedStates, previewOptions) => {
  const def = []
  let assertionIdAcc = 0
  for (let a of assertions) {
    const {expr, identifiers, position} = a
    const numberId = ++ assertionIdAcc
    const assertionId = `<assertion${numberId}>`
    const cleanExpr = previewOptions.showDetailedExpressions
      ? dropRegex(previewOptions.showAsMathOperators ? formatCycloneExpr(expr, CycloneParsingEntry.Assert) : expr, /in\s*\(/g).trim()
      : `assertion (${position.startPosition.line}:${position.startPosition.column + 1})`
    statesDef.push(`${assertionId}[label=" ${cleanExpr} ", fontcolor=green, color=green];`)
    for (let ident of identifiers) {
      if (!definedStates.has(ident)) {
        statesDef.push(genUndefinedState(ident, previewOptions))
        definedStates.add(ident)
      }
      def.push(`${assertionId} -> ${ident}[color=green];`)
    }
  }

  return def
}

const genGraphvizGoalDef = ({invariants, states, expr, finalPosition}, statesDef, invariantCtx, definedStates, opts) => {
  const def = []
  const id = `<goal>`
  const cleanRes = []
  const hasStates = states.size > 0
  if (hasStates) {
    cleanRes.push(/(reach|stop)\s*\(/g)
  }
  if (invariants.size) {
    cleanRes.push(/with\s*\(/g)
  }
  let cleanExpr, goalLabel = ""
  const reachMatch = /(reach|stop)(?:\s*\(\w+(,\s*\w+)*\))/.exec(expr)
  if (hasStates && reachMatch) {
    goalLabel = reachMatch[1] ?? "reach"
  }
  if (opts.showDetailedExpressions) {
    cleanExpr = dropRegexes(opts.showAsMathOperators ? formatCycloneExpr(expr, CycloneParsingEntry.Check) : expr, cleanRes).trim() + ` ${goalLabel}`
  } else {
    cleanExpr = `${expr.split(" ").slice(0, 2).join(" ") ?? "check"} ${finalPosition ? `(${finalPosition.startPosition.line}:${finalPosition.startPosition.column + 1})` : ""} ${goalLabel}`
  }
  statesDef.push(`${id}[label=" ${cleanExpr} ", color=darkorange, fontcolor=darkorange];`)
  if (opts.showInvariant) {
    for (let inv of invariants) {
      if (!invariantCtx.defined.has(inv)) {
        invariantCtx.definitions.push(genUndefinedInvariant(inv, opts))
        invariantCtx.defined.add(inv)
      }
      def.push(`${id} -> ${inv}[color=darkorange];`)
    }
  }

  // goal states
  for (let state of states) {
    if (!definedStates.has(state)) {
      statesDef.push(genUndefinedState(state, opts))
      definedStates.add(state)
    }

    def.push(`${id} -> ${state}[color=darkorange];`)
  }

  return def
}

export const genGraphvizPreview = (
  {
    states,
    trans,
    assertions,
    invariants,
    goal
  },
  options,
  resultPaths = null
) => {
  const previewOptions = options.preview
  const statesDef = genGraphvizStatesDef(states.values(), previewOptions, resultPaths)
  const definedStates = new Set(states.keys())
  const transRelations = genGraphvizTransDef(definedStates, resultPaths, trans, statesDef, previewOptions)

  const invariantCtx = previewOptions.showInvariant ? genGraphvizInvariantsDef(invariants, statesDef, definedStates, previewOptions) : null

  const assertionsDef = previewOptions.showAssertion ? genGraphvizAssertionsDef(assertions, statesDef, definedStates, previewOptions) : null

  const goalDef = goal && previewOptions.showGoal ? genGraphvizGoalDef(goal, statesDef, invariantCtx, definedStates, previewOptions).join("\n") : null

  const dir = options.direction === DisplayDirection.Auto
    ? (transRelations.length ? "TB" : "LR")
    : options.direction

  const segments = [
    `rankdir=${dir};`,
    `<start>[shape=none, label = ""];`,
    statesDef.join("\n"),
    transRelations.map(t => t.join("\n")).join("\n"),
    // invariantsDef.join("\n"),
    // assertionsDef.join("\n"),
  ]
  if (invariantCtx) {
    segments.push(invariantCtx.definitions.join("\n"))
  }
  if (assertionsDef) {
    segments.push(assertionsDef.join("\n"))
  }
  if (goalDef) {
    segments.push(goalDef)
  }

  return `digraph {\n\n${segments.join("\n\n")}\n\n}`
}

export const genGraphvizExecutionResultPaths = ({states, edges}, options, visualData) => {
  const codes = []
  // const hasOverall = edges.length > 1
  // const overall = hasOverall ? [] : null
  // const overallDir = options.direction === DisplayDirection.Auto
  //   ? "TB"
  //   : options.direction
  // const statePaths = new Map()

  const stateAttrMap = new Map()
  const visualStates = [...visualData.states.values()].filter(({identifier}) => states.has(identifier))
  for (let {identifier, attrs} of visualStates) {
    const [fill, isFinal, isStart] = getNodeStyle(attrs)
    const shape = isFinal
      ? ", peripheries=2"
      : ""
    stateAttrMap.set(identifier, `${identifier}[label="${identifier}", style=filled, fillcolor=${fill}${shape}];${isStart ? `<start> -> ${identifier};` : ""}`)
  }

  const dir = options.direction === DisplayDirection.Auto
    ? "LR" // states.size <= 6 ? "LR" : "TB"
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
    }

    const joined = pieces.join("\n")
    const statesDef = [...new Set(edge)]
      .map(s => stateAttrMap.get(s))
      .join("\n")
    codes.push(`digraph {\n\nrankdir=${dir};<start>[shape=none, label = ""];\n${statesDef}\n${joined}\n\n}`)
  }

  return codes
}

// THE CODE FOR THE <table> ELEMENT'S STYLE REFERENCED https://graphviz.org/Gallery/directed/psg.html
// OTHER PARTS ARE WRITTEN ON MY OWN
export const genGraphvizTrace = (traces, options, visualData) => {
  const codes = []
  let timestamp = traces.timestamp
  let label = timestamp ? `\nlabel=\"${visualData.graphIdentifier ? visualData.graphIdentifier + "\n" : ""}${timestamp}\";\nlabelloc=\"b\";\nlabeljust="c";` : ""

  for (let trace of traces.path) {
    const path = []
    const states = []
    let n = 1

    for (let {
      state,
      isAbstract,
      raw,
      fields
    } of trace) {
      const [color] = getNodeStyle(visualData.states.get(state).attrs)
      const id = `s${n++}`
      path.push(id)
      const bg = fields.length ? "white" : color
      const label = `<table border="0" cellborder="0" cellpadding="3" bgcolor="${bg}"><tr><td bgcolor="${color}" align="center" colspan="2"><font color="black"><b>${raw}</b></font></td></tr>${fields.map(({key, value}) => `<tr><td align="left" port="r1">${key} = ${value}</td></tr>`)}</table>`
      states.push(`${id}[style = "filled" penwidth = 1 fillcolor = "${bg}" fontname = "Courier New" shape = "Mrecord" label =<${label}>];`)
    }

    const dir = options.direction === DisplayDirection.Auto
      ? path.length <= 6 ? "LR" : "TB"
      : options.direction

    codes.push(`digraph {\n\nrankdir=${dir};${label}\n\n${states.join("\n")}\n\n${path.join("->")};\n\n}`)
  }

  return codes
}