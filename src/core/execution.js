import {posPair} from "@/lib/position";
import {ErrorSource, ExtendedErrorType} from "@/core/definitions";


const regexFindPathInResultNG = /\w+->\w+(->\w+)*/
const regexFindPathInResult = /\w+->\w+(->\w+)*/g
const regexFindStateInTrace = /\[\d+\]\.@\w+/
const regexFindErrorInResult = /(line\s*:\s*\d+)|(position\s*:\d+)/g
const regexFindLengthInResult = /<\d+>\s*\w+->/g
const regexNoCounterExample = /no\s+counter[\s-]+example\s+found/i
const regexNoPath = /no\s+path\s+found/i

export const ResponseCode = {
  InvalidParams: 0,
  Success: 1,
  SyntaxError: 2,
  InvalidOptions: 3,
  UnsuccessfulExecution: 4,
  InternalError: 5,
  ExecutionTimeout: 6,
  Enqueued: 7,
  NotSupported: 8,
  NotFound: 9
}

// export const POLL_INTERVAL = 2000

export const translateErrorResponse = (code, data) => {
  switch (code) {
    case ResponseCode.InvalidParams: return "Invalid parameters sent to server"
    case ResponseCode.SyntaxError: return "There are syntax errors in the source code, please try to fix them before execution"
    case ResponseCode.InvalidOptions: return data ? `These compiler options are not allowed by the server: ${data.join(", ")}` : "Disallowed options exists in source code"
    case ResponseCode.UnsuccessfulExecution: return "Unsuccessful execution, please try again later"
    case ResponseCode.InternalError: return "Internal error. Please try again later"
    case ResponseCode.ExecutionTimeout: return `Execution timeout: it takes too long to execute the source code. ${data ? `(over ${data}ms, this value is set by the server)` : ""}`
    case ResponseCode.NotSupported: return "API not supported"
    case ResponseCode.NotFound: return "Resource not exists"

    default: return "Unknown Error"
  }
}

export const parseTrace = traceContent => {
  const lines = traceContent.split(/[\r\n]+/)
  const traces = []
  let inTrace = false
  let currentTraceContext = null
  let currentTrace = []
  let traceCount = 0

  for (let line of lines) {
    const trimmed = line.trim()
    if (!trimmed.length) {
      continue
    }
    if (regexFindStateInTrace.test(trimmed)) {
      inTrace = true
      // if (currentTraceContext) {
      //   currentTrace.push(currentTraceContext)
      // }
      const identifiers = trimmed.match(/\w+/g)
      const state = identifiers[1]

      currentTraceContext = {
        // state:
        state,
        isAbstract: identifiers.length > 2 && identifiers[identifiers.length - 1] === "abstract",
        raw: trimmed,
        fields: []
      }
      currentTrace.push(currentTraceContext)
    } else if (trimmed.startsWith("=") && /TRACE\s*\(\d+\)/.test(trimmed)) {
      inTrace = false
      if (traceCount > 0) {
        traces.push(currentTrace)
      }
      currentTrace = []
      traceCount ++
    } else if (inTrace) {
      const [key, value] = trimmed.split(":")
      currentTraceContext?.fields.push({key, value, raw: trimmed})
    }
  }

  traces.push(currentTrace)

  return traces

  // return traces[0]?.length ? traces : traces.slice(1)
}

export const parseExecutionResultPaths = result => {
  const stateSet = new Set()
  const edges = []
  const lengths = new Set(
    result
      .match(regexFindLengthInResult)
      ?.map(it => it.match(/\d+/)[0])
      .filter(it => it != null)
  )
  const matched = result.match(regexFindPathInResult)
  if (matched?.length) {
    for (let path of matched) {
      const states = path.split("->")
      if (!states.length) {
        continue
      }
      for (let s of states) {
        stateSet.add(s)
      }
      edges.push(states)
    }
  }
  return {
    states: stateSet,
    edges,
    lengths: [...lengths].sort(),
    total: edges.length
  }
}

export const sanitizeResult = result => {
  const lines = result.split(/[\r\n]+/)
  const sanitized = []
  const errors = []
  for (let line of lines) {
    const trimmed = line.trim()
    const errLineCol = trimmed
      .match(regexFindErrorInResult)
      ?.map(s => parseInt(s.match(/\d+/g)[0]))
      ?.filter(n => !isNaN(n))
    if (errLineCol) {
      const [line, col] = errLineCol
      errors.push({
        source: ErrorSource.Remote,
        ...posPair(
          line, col,
          line, col + 1
        ),
        msg: trimmed,

        type: ExtendedErrorType.RemoteError,
        params: {msg: trimmed}
      })

      sanitized.push(`<span style='color: red'>${trimmed}</span>`)
    } else {
      if (regexFindPathInResultNG.test(trimmed)) {
        sanitized.push(`<b style="color: #61aeee">${trimmed}</b>`)
      } else if (regexNoPath.test(trimmed)) {
        sanitized.push(`<b style="color: #fa5252">${trimmed}</b>`)
      } else if (regexNoCounterExample.test(trimmed)) {
        sanitized.push(`<b style="color: #74B816">${trimmed}</b>`)
      } else {
        sanitized.push(trimmed)
      }
    }
  }
  return {errors, sanitized: sanitized.join("<br>")}
}

export const isNoCounterExampleFound = (result) => regexNoCounterExample.test(result)