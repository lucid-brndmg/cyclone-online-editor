import {create} from "zustand";

export const useEditorExecutionStore = create((set, get) => ({
  // pollId: null,
  // pollBegins: 0,
  //
  // resetPoll: () => {
  //   set({pollId: null, pollBegins: 0})
  // },

  isPolling: false,
  setIsPolling: isPolling => set({isPolling}),

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
  setParsedPaths: parsedPaths => set({parsedPaths}),

  errorMessage: "",
  setErrorMessage: errorMessage => set({errorMessage})
}))