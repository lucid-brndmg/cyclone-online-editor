import {create} from "zustand";

export const useGraphvizStore = create((set, get) => ({
  graphvizId: 0,
  assignGraphvizId: () => {
    const {graphvizId} = get()
    set({graphvizId: graphvizId + 1})
    return `graphviz-${graphvizId}`
  },

  codePreviewLastHeight: 0,
  setCodePreviewLastHeight: codePreviewLastHeight => set({codePreviewLastHeight}),

  // codePreviewTrans: null,
  // setCodePreviewTrans: codePreviewTrans => set({codePreviewTrans}),

  traceVisualStates: [],
  insertTraceVisualStates: (i, k, v) => {
    const {traceVisualStates} = get()
    if (traceVisualStates[i]) {
      traceVisualStates[i][k] = v
    } else {
      const s = {}
      s[k] = v
      traceVisualStates[i] = s
    }
    set({traceVisualStates: [...traceVisualStates]})
  },
}))