import spec from "../../../resource/cyclone_spec.json"
export default (hljs) => {
  const LITERALS = spec.literals
  const TYPES = spec.types
  const KWS = spec.keywords
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

