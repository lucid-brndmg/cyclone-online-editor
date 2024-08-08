import {create} from "zustand";

export const useEditorExecutionStore = create((set, get) => ({
  isPolling: false,
  setIsPolling: isPolling => set({isPolling}),

  executionResult: null,
  setExecutionResult: executionResult => set({executionResult}),

  visualDataCopy: null,
  setVisualDataCopy: visualDataCopy => set({visualDataCopy}),

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
  setErrorMessage: errorMessage => set({errorMessage}),

  info: null,
  setInfo: info => set({info}),

  isLoadingInfo: false,
  setIsLoadingInfo: isLoadingInfo => set({isLoadingInfo}),

  refreshServerInfo: async execServerUrl => {
    const {setInfo, setIsLoadingInfo} = get()
    setIsLoadingInfo(true)
    try {
      const info = await fetch(execServerUrl, {mode: "cors"}).then(resp => resp.json())
      setInfo(info?.data)
    } catch (e) {
      console.log("failed to fetch execution server info", e)
      setInfo(null)
    } finally {
      setIsLoadingInfo(false)
    }
  }

  // resultVizStates: new Map(),
  // traceVizStates: new Map(),
  // resetVizStates: () => set({resultVizStates: new Map(), traceVizStates: new Map()}),
  //
  // insertResultVizState: (filename, state) => {
  //   const {resultVizStates} = get()
  //   resultVizStates.set(filename, state)
  //   set({resultVizStates: new Map(resultVizStates)})
  // },
  //
  // insertTraceVizState: (filename, state) => {
  //   const {traceVizStates} = get()
  //   traceVizStates.set(filename, state)
  //   set({resultVizStates: new Map(traceVizStates)})
  // }

}))