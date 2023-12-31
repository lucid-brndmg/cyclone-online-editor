export const customSlice = (s, length) => {
  switch (length) {
    case -1: return s
    case 0: return ""
    default: return s.slice(0, length)
  }
}

export const parseBool = s => [
  "TRUE", "YES", "1"
].includes(s?.toUpperCase())