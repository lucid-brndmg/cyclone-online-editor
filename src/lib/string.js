const readUntil = (s, pos, f) => {
  let result = ""
  for (let i = pos; i < s.length; i++) {
    const c = s[i]
    if (f(c)) {
      result += c
    }
  }

  return result
}

export const simplify = (s, length, suffix = ' ...') => s < length
  ? s
  : (s.slice(0, length) + suffix)

export const dropRegex = (s, re) => {
  const exprMatch = [...s.matchAll(re)]
  const last = exprMatch[exprMatch.length - 1]
  const cleanExpr = last ? s.slice(0, last.index) : s
  return cleanExpr
}

export const dropRegexes = (s, res) => {
  let sc = s.slice()
  for (let re of res) {
    sc = dropRegex(sc, re)
  }

  return sc
}