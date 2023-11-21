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