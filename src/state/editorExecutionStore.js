import {create} from "zustand";

export const useEditorExecutionStore = create((set, get) => ({
  isPolling: false,
  setIsPolling: isPolling => set({isPolling}),

  executionResult: null,
  setExecutionResult: executionResult => set({executionResult}),

  visualDataCopy: null,
  setVisualDataCopy: visualDataCopy => set({visualDataCopy}),

  compilerOptions: null,
  setCompilerOptions: compilerOptions => set({compilerOptions}),

  isLoading: false,
  setIsLoading: isLoading => set({isLoading}),

  isError: false,
  setIsError: isError => set({isError}),

  parsedPaths: null,
  setParsedPaths: parsedPaths => set({parsedPaths}),

  parsedTraces: null,
  setParsedTraces: parsedTraces => set({parsedTraces}),

  traceIsGraphviz: false,
  setTraceIsGraphviz: traceIsGraphviz => set({traceIsGraphviz}),

  errorMessage: "",
  setErrorMessage: errorMessage => set({errorMessage})
}))