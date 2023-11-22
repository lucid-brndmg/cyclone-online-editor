import {cycloneFullKeywords, cycloneOperators} from "@/core/specification";

export const CycloneLanguageId = "cyclone"

export const CycloneMonacoConfig = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  folding: {
    markers: {
      start: new RegExp('^\\s*//\\s*(?:(?:#?region\\b)|(?:<editor-fold\\b))'),
      end: new RegExp('^\\s*//\\s*(?:(?:#?endregion\\b)|(?:</editor-fold>))')
    }
  },

  // this regex will match every keyword, identifier, enum reference and operator in order to display reference info for each
  wordPattern: /([#a-zA-Z_])[\w.]*/g // new RegExp(`(([#a-zA-Z_])[\\w.]*)|(${cycloneOperators.sort((a, b) => b.length - a.length).map(op => [...op].map(c => "\\" + c).join("")).join("|")})`, "g") // IMPORTANT: INCLUDES #ENUM && A.B
}


export const CycloneMonacoTokens = {
  defaultToken: '',
  keywords: cycloneFullKeywords,

  operators: cycloneOperators,

  // we include these common regular expressions
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes: /\\([abfnrtv\\"'])/,
  digits: /\d+/,

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      // identifiers and keywords
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': { token: 'keyword.$0' },
          '@default': 'identifier'
        }
      }],

      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'delimiter',
          '@default': ''
        }
      }],

      // @ annotations.
      [/@\s*[a-zA-Z_][\w]*/, 'annotation'],

      // numbers
      [/(@digits)/, 'number'],
      [/(@digits)\.(@digits)/, 'number.float'],

      // delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
      [/"/, 'string', '@string'],

      // characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid']
    ],

    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop']
    ],
  },
}