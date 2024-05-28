import {cycloneKeywords, cycloneLiterals, cycloneOptions, cycloneTypes} from "@/core/specification";
import snippets from "../../../resource/code_snippet_manifest.json"

const defaultSuggestionLabels = {
  keywords: cycloneKeywords,
  values: cycloneLiterals,
  types: cycloneTypes,
  options: cycloneOptions,
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

      ...defaultSuggestionLabels.options.map(opt => ({
        label: opt,
        insertText: opt,
        kind: monaco.languages.CompletionItemKind.Property,
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