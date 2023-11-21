import {cycloneKeywords, cycloneLiterals, cycloneTypes} from "@/core/specification";
import snippets from "../../../resource/code_snippet_manifest.json"

const defaultSuggestionLabels = {
  keywords: cycloneKeywords,
  values: cycloneLiterals,
  types: cycloneTypes,
  snippets: snippets
}

export const getDefaultCompletionItems = (monaco) => {
  return {
    suggestions: [
      ...defaultSuggestionLabels.keywords.map(word => ({
        label: word,
        insertText: word,
        kind: monaco.languages.CompletionItemKind.Keyword
      })),

      ...defaultSuggestionLabels.values.map(word => ({
        label: word,
        insertText: word,
        kind: monaco.languages.CompletionItemKind.Value,
      })),

      ...defaultSuggestionLabels.types.map(word => ({
        label: word,
        insertText: word,
        kind: monaco.languages.CompletionItemKind.TypeParameter,
      })),

      ...defaultSuggestionLabels.snippets.map(({label, insert}) => ({
        label,
        insertText: insert,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        kind: monaco.languages.CompletionItemKind.Snippet
      }))
    ]
  }
}