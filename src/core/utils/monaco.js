export const locateToCode = (editor, {line, column}) => {
  editor.setPosition({lineNumber: line, column: column })
  editor.revealPosition({ lineNumber: line, column: column });
  editor.focus()
}