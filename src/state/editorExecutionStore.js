import {create} from "zustand";

export const useEditorExecutionStore = create((set, get) => ({
  executionResult: null,
  setExecutionResult: executionResult => set(() => ({executionResult})),

  stateTransCopy: null,
  setStateTransCopy: stateTransCopy => set({stateTransCopy}),

  isLoading: false,
  setIsLoading: isLoading => set({isLoading}),

  isError: false,
  setIsError: isError => set({isError}),

  // paths: 0,
  // setPaths: paths => set({paths})

  parsedPaths: null,
  setParsedPaths: parsedPaths => set({parsedPaths})
}))