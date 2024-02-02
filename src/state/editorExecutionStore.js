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

  visualDataCopy: null,
  setVisualDataCopy: visualDataCopy => set({visualDataCopy}),

  isLoading: false,
  setIsLoading: isLoading => set({isLoading}),

  isError: false,
  setIsError: isError => set({isError}),

  // paths: 0,
  // setPaths: paths => set({paths})

  parsedPaths: null,
  setParsedPaths: parsedPaths => set({parsedPaths}),

  parsedTraces: null,
  setParsedTraces: parsedTraces => set({parsedTraces}),

  traceIsGraphviz: false,
  setTraceIsGraphviz: traceIsGraphviz => set({traceIsGraphviz}),

  errorMessage: "",
  setErrorMessage: errorMessage => set({errorMessage})
}))