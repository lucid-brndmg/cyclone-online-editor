import {posPair} from "@/lib/position";

export const getBlockPositionPair = ctx => {
  const text = ctx.start.text || ctx.stop.text
  const textLength= !text || text === "<EOF>" ? 1 : text.length
  const startLine = ctx.start.line
  const stopLine = ctx.stop.line
  const startCol = ctx.start.column
  const stopCol = ctx.stop.column

  return posPair(
    startLine, startCol,
    stopLine, stopCol + (stopLine === startLine && stopCol === startCol ? textLength : 0) // + textLength
  )
}

export const getSymbolPosition = (symbol, length) => {
  const line = symbol.line
  const col = symbol.column
  return posPair(
    line, col,
    line, col + (length || symbol.text.length)
  )
}

export const getIdentifiersInList = ctx => ctx.children?.filter(c => c.constructor.name === "IdentifierContext")?.map(it => it.start.text) ?? []

export const getParentExpression = ctx => ctx.parentCtx.start.getInputStream().getText(ctx.parentCtx.start.start, ctx.parentCtx.stop.stop)

