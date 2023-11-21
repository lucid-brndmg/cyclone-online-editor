import {popMulti} from "@/lib/list";
import {posRangeIncludes} from "@/lib/position";

export class CategorizedCountTable extends Map {
  incr(cate, key, incr = 1) {
    if (this.has(cate)) {
      const sub = this.get(cate)
      if (sub.has(key)) {
        const added = sub.get(key) + incr
        if (added <= 0) {
          sub.delete(key)
        } else  {
          sub.set(key, added)
        }
      } else {
        sub.set(key, incr)
      }
    } else {
      super.set(cate, new Map([[key, incr]]))
    }


  }

  getCounts(categories, key) {
    const counts = []
    let hasCount = false
    const iterCategories = categories.length
      ? categories
      : this.keys()

    for (let cate of iterCategories) {
      if (this.has(cate)) {
        const sub = this.get(cate)
        if (sub.has(key)) {
          const c = sub.get(key)
          if (c > 0) {
            hasCount = true
          }
          counts.push(c)
        } else {
          counts.push(0)
        }
      } else {
        counts.push(0)
      }
    }

    return {counts, hasCount}
    // counts: [Int], hasCount: Bool
  }

  hasCounts(categories, key) {
    if (categories == null) {
      // allows any
      return true
    }

    const iterCategories = categories.length
      ? categories
      : this.keys()

    for (let cate of iterCategories) {
      if (this.has(cate)) {
        const sub = this.get(cate)
        if (sub.has(key)) {
          const c = sub.get(key)
          if (c > 0) {
            return true
          }
        }
      }
    }

    return false
  }

  sub(table) {
    for (let [cate, counts] of table.entries()) {
      if (this.has(cate)) {
        const sub = this.get(cate)
        for (let [key, count] of counts.entries()) {
          if (sub.has(key)) {
            const c = sub.get(key) - count
            if (c <= 0) {
              sub.delete(key)
            } else {
              sub.set(key, c)
            }
          }
        }
      }
    }
  }
}

// export class CountTable extends Map {
//   incr(key) {
//
//   }
// }

export class StackedTable extends Map {
  constructor(nonRepeatedInit) {
    super();

    if (nonRepeatedInit) {
      for (let [key, v] of nonRepeatedInit) {
        this.set(key, [v])
      }
    }
  }

  push(key, value) {
    if (this.has(key)) {
      this.get(key).push(value)
    } else {
      this.set(key, [value])
    }
  }

  pop(key) {
    if (this.has(key)) {
      const stack = this.get(key)
      const content = stack.pop()

      if (stack.length === 0) {
        this.delete(key)
      }

      return content
    }

    return null
  }

  peek(key) {
    if (this.has(key)) {
      const stack = this.get(key)
      return stack[stack.length - 1]
    }
    return null
  }

  getLength(key, filterFn = null) {
    if (this.has(key)) {
      const stack = this.get(key)
      if (filterFn) {
        return stack.filter(filterFn).length
      } else {
        return stack.length
      }
    }

    return 0
  }

  subCategorizedCountTable(countTable) {
    for (let table of countTable.values()) {
      this.subCountTable(table)
    }
  }

  subCountTable(countTable) {
    for (let [key, counts] of countTable) {
      if (counts > 0) {
        const stack = this.get(key)
        popMulti(stack, counts)

        if (stack.length === 0) {
          this.delete(key)
        }
      }
    }
  }

  extractLatest() {
    const results = []
    for (let stack of this.values()) {
      if (stack.length) {
        results.push(stack[stack.length - 1])
      }
    }

    return results
  }

  extractLatestToMap(keySelector) {
    const results = new Map()
    for (let stack of this.values()) {
      if (stack.length) {
        const last = stack[stack.length - 1]
        results.set(keySelector(last), last)
      }
    }

    return results
  }
}

export class CategorizedStackTable extends Map {
  constructor(init) {
    super();
    if (init) {
      for (let [cate, subInit] of init) {
        this.set(cate, new StackedTable(subInit))
      }
    }
  }

  push(category, key, value) {
    if (this.has(category)) {
      this.get(category).push(key, value)
    } else {
      const tbl = new StackedTable()
      tbl.push(key, value)
      this.set(category, tbl)
    }
  }

  pop(category, key) {
    if (this.has(category)) {
      return this.get(category).pop(key)
    } else {
      return null
    }
  }

  peek(category, key) {
    if (this.has(category)) {
      return this.get(category).peek(key)
    }

    return null
  }

  getLength(category, key) {
    if (this.has(category)) {
      return this.get(category).getLength(key)
    } else {
      return 0
    }
  }

  extract(convertFn = null, allowedCategories = null) {
    const result = []
    for (let [cate, table] of this) {
      if (!allowedCategories || allowedCategories.includes(cate)) {
        for (let stack of table.values()) {
          result.push(...(convertFn ? stack.map(convertFn) : stack))
        }
      }
    }

    return result
  }

  subCategorizedCountTable(tbl) {
    for (let [cate, subCountTable] of tbl) {
      const subStackTable = this.get(cate)
      if (!subStackTable) {
        continue
      }
      subStackTable.subCountTable(subCountTable)
    }
  }

}

export class CountTable extends Map {
  incr(key, incr = 1) {
    if (this.has(key)) {
      this.set(key, (this.get(key) ?? 0) + incr)
    } else {
      this.set(key, incr)
    }
  }
}

export class PositionTable {
  context = []

  set({startPosition, stopPosition}, value) {
    this.context.push({
      startPosition,
      stopPosition,
      value
    })

    // if (!this.context[x]) {
    //   this.context[x] = {}
    // }
    //
    // this.context[x][y] = value
  }

  find(line, column, filterFn = null) {
    // TODO: optimize this using binary search

    const candidates = this.context.filter(pair => posRangeIncludes({line, column}, pair) && (filterFn ? filterFn(pair.value) : true))
    return candidates[candidates.length - 1]
  }

  sort() {
    // SCOPES HAVE A SPECIAL FEATURE:
    // LET SCOPE A, B
    // IF A.START < B.START THEN A.STOP > B.STOP
    // THEY CAN ONLY BE NESTED, NEVER INTERSECTED

    this.context.sort((a, b) => {
      if (a.startPosition.line === b.startPosition.line) {
        return a.startPosition.column - b.startPosition.column
      } else {
        return a.startPosition.line - b.startPosition.line
      }
    })
  }
}

export class FixedCoordinateTable {
  entry = new Map()

  set(key, fixedCoords, value) {
    if (this.entry.has(key)) {
      this.entry.get(key).set(fixedCoords, value)
    } else {
      this.entry.set(key, new Map([[fixedCoords, value]]))
    }
  }

  get(key, fixedCoords) {
    if (this.entry.has(key)) {
      return this.entry.get(key).get(fixedCoords)
    }

    return null
  }
}