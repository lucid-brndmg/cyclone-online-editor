export const popMulti = (xs, length) => {
  let i = 0
  while (i < length) {
    xs.pop()
    i ++
  }
}

export const popMultiStore = (xs, length) => {
  let i = 0
  let ys = []
  while (i < length) {
    ys.push(xs.pop())
    i ++
  }

  return ys
}

export const sieve = (xs, filterFn) => {
  const fulfilled = []
  const rejected = []
  for (let elem of xs) {
    if (filterFn(elem)) {
      fulfilled.push(elem)
    } else {
      rejected.push(elem)
    }
  }

  return [fulfilled, rejected]
}

export const sieveCount = (xs, filterFn) => {
  let fulfilled = 0
  let rejected = 0
  for (let elem of xs) {
    if (filterFn(elem)) {
      fulfilled ++
    } else {
      rejected ++
    }
  }

  return [fulfilled, rejected]
}

export const pairIncludes = (pairs, targetPair) => {
  for (let pair of pairs) {
    const [a, b] = pair
    const [c, d] = targetPair
    if (a === c && b === d) {
      return true
    }
  }

  return false
}

export const map2elems = (xs, f) => {
  if (xs.length < 2) {
    return []
  }

  const result = []
  for (let i = 0; i < xs.length; i++) {
    const j = i + 1
    const a = xs[i]
    const b = xs[j]
    result.push(f(a, b, i, j))
    if (i === xs.length - 2) {
      break
    }
  }

  return result
}