const formatLineCol = (line, col) => `${line},${col}`

export class ErrorStorage {
  storage = [] // new Map()
  max = 0

  events = {
    onError: null,
    onErrors: null,
    onClear: null
  }

  // length = 0

  constructor(max = 0, {onError, onClear, onErrors}) {
    this.max = max
    this.events.onError = onError
    this.events.onClear = onClear
    this.events.onErrors = onErrors
  }

  setError(e) {
    // const existsSource = this.storage.has(e.source)
    // if (existsSource) {
    //   const lineColTbl = this.storage.get(e.source)
    //   const fmt = formatLineCol(e.startPosition.line, e.startPosition.column)
    //   lineColTbl.set(fmt, e)
    // } else {
    //   const lineCol = new Map()
    //   this.storage.set(e.source, lineCol)
    //   lineCol.set(formatLineCol(e.startPosition.line, e.startPosition.column), e)
    // }

    if (this.max > 0 && this.storage.length >= this.max) {
      return
    }

    this.storage.push(e)
    if (this.events.onError) {
      this.events.onError()
    }
    // console.log(e)
  }

  setErrors(es) {
    if (this.max > 0 && this.storage.length >= this.max) {
      return
    }
    for (let e of es) {
      if (this.max > 0 && this.storage.length >= this.max) {
        break
      }
      this.storage.push(e)
      // this.setError(e)
    }

    this.events.onErrors && this.events.onErrors()
  }

  getAll() {
    // const errors = []
    // for (const lineColTbl of this.storage.values()) {
    //   for (const e of lineColTbl.values()) {
    //     errors.push(e)
    //   }
    // }
    //
    // return errors

    // return this.storage.extract(mapper, allowedKinds)

    return this.storage
  }

  clear() {
    this.storage = []
    this.events.onClear && this.events.onClear()
  }
}