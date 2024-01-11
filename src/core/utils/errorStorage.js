class ErrorStorage {
  storage = [] // new Map()
  max = 0

  events = {
    onErrors: null,
    onClear: null
  }

  // length = 0

  constructor(max = 0, {onClear, onErrors}) {
    this.max = max
    // this.events.onError = onError
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
    if (this.events.onErrors) {
      this.events.onErrors()
    }
    // console.log(e)
  }

  setErrors(es) {
    const hasMax = this.max > 0
    const maxErrors = this.max
    if (hasMax && this.storage.length >= maxErrors) {
      console.log("warn: error storage full", this)
      return
    }
    for (let e of es) {
      this.storage.push(e)
      if (hasMax && this.storage.length >= maxErrors) {
        console.log("warn: error storage full", this)
        break
      }
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

export default ErrorStorage