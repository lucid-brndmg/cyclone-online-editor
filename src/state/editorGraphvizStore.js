import {create} from "zustand";

export const useGraphvizStore = create((set, get) => ({
  graphvizId: 0,
  assignGraphvizId: () => {
    const {graphvizId} = get()
    set({graphvizId: graphvizId + 1})
    return `graphviz-${graphvizId}`
  }
}))