import spec from "../../../resource/cyclone_spec.json"

/* HLJS one light
Reference: https://github.com/highlightjs/highlight.js/blob/main/src/styles/atom-one-light.css

Atom One Light by Daniel Gamage
Original One Light Syntax theme from https://github.com/atom/one-light-syntax

base:    #fafafa
mono-1:  #383a42
mono-2:  #686b77
mono-3:  #a0a1a7
hue-1:   #0184bb
hue-2:   #4078f2
hue-3:   #a626a4
hue-4:   #50a14f
hue-5:   #e45649
hue-5-2: #c91243
hue-6:   #986801
hue-6-2: #c18401

*/

/* HLJS one dark
Reference: https://github.com/highlightjs/highlight.js/blob/main/src/styles/atom-one-dark.css

Atom One Dark by Daniel Gamage
Original One Dark Syntax theme from https://github.com/atom/one-dark-syntax

base:    #282c34
mono-1:  #abb2bf
mono-2:  #818896
mono-3:  #5c6370
hue-1:   #56b6c2
hue-2:   #61aeee
hue-3:   #c678dd
hue-4:   #98c379
hue-5:   #e06c75
hue-5-2: #be5046
hue-6:   #d19a66
hue-6-2: #e6c07b

*/


export const hljsTheme = {
  light: `
.hljs {
    color: #383a42;
    background: #fafafa;
}

.hljs-comment,
.hljs-quote {
    color: #a0a1a7;
    font-style: italic;
}

.hljs-doctag,
.hljs-keyword,
.hljs-formula {
    color: #a626a4;
}

.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst {
    color: #e45649;
}

.hljs-literal {
    color: #0184bb;
}

.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta .hljs-string {
    color: #50a14f;
}

.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
    color: #986801;
}

.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
    color: #4078f2;
}

.hljs-built_in,
.hljs-title.class_,
.hljs-class .hljs-title {
    color: #c18401;
}

.hljs-emphasis {
    font-style: italic;
}

.hljs-strong {
    font-weight: bold;
}

.hljs-link {
    text-decoration: underline;
}
  `,
  dark: `
.hljs {
    color: #abb2bf;
    background: #282c34;
}

.hljs-comment,
.hljs-quote {
    color: #5c6370;
    font-style: italic;
}

.hljs-doctag,
.hljs-keyword,
.hljs-formula {
    color: #c678dd;
}

.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst {
    color: #e06c75;
}

.hljs-literal {
    color: #56b6c2;
}

.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta .hljs-string {
    color: #98c379;
}

.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
    color: #d19a66;
}

.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
    color: #61aeee;
}

.hljs-built_in,
.hljs-title.class_,
.hljs-class .hljs-title {
    color: #e6c07b;
}

.hljs-emphasis {
    font-style: italic;
}

.hljs-strong {
    font-weight: bold;
}

.hljs-link {
    text-decoration: underline;
}
  `
}

// Code highlight spec for highlight.js that presents in documents
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

