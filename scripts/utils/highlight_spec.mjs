/*
Modified from language: Go
Author: Stephan Kountso aka StepLg <steplg@gmail.com>
https://github.com/highlightjs/highlight.js/blob/main/src/languages/go.js
*/

// Since Node.js only supports .ESM extension and next-js requires common javascript file in src/ directory,
// This is a pretty 'hacky' way to define the highlight spec we need
// both for next-js runtime (powered by webpack & stuff) and scripts (powered by vanilla Node.js)
// We defined the spec as a function but wrapped into a string
// and we do EVAL(code) to get the function in scripts
// and write the string directly to a next-js module to satisfy both needs
// NOTE: the function string shouldn't contain FREE VARIABLES, hence we write some of them as parameter to do a bit 'code-generation'

const fromDef = (spec, field, jsonImportIdent) => jsonImportIdent
  ? `${jsonImportIdent}.${field}`
  : JSON.stringify(field)

const highlightSpecCode = (spec, jsonImportIdent) => `(hljs) => {
  const LITERALS = ${fromDef(spec, "literals", jsonImportIdent)}
  const TYPES = ${fromDef(spec, "types", jsonImportIdent)}
  const KWS = ${fromDef(spec, "keywords", jsonImportIdent)}
  const KEYWORDS = {
    keyword: KWS,
    type: TYPES,
    literal: LITERALS,
    // built_in: BUILT_INS
  };
  return {
    name: 'Cyclone',
    aliases: [ 'cyclone' ],
    keywords: KEYWORDS,
    illegal: '</',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.C_NUMBER_MODE,
      {
        className: 'string',
        variants: [
          hljs.QUOTE_STRING_MODE,
          hljs.APOS_STRING_MODE,
        ]
      },
      {
        className: 'symbol',
        begin: /'[a-zA-Z_][a-zA-Z0-9_]*/
      },
    ]
  };
}
`

export default highlightSpecCode