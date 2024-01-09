export const pos = (line, column) => ({
  line, column
})

export const posPair = (startLine, startColumn, stopLine, stopColumn) => ({
  startPosition: pos(startLine, startColumn),
  stopPosition: pos(stopLine, stopColumn)
})

// current < target
export const posRangeIncludes = ({line, column}, targetPair) => {
  const {startPosition, stopPosition} = targetPair
  return line >= startPosition.line
    && line <= stopPosition.line
    && (
      (line > startPosition.line && line < stopPosition.line)
      || (line === startPosition.line && column >= startPosition.column)
      || (line === stopPosition.line && column <= stopPosition.column)
    )
    // && column >= startPosition.column
    // && ( line === startPosition.line && column <= stopPosition.column || )
}