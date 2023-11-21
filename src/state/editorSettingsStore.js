import {create} from "zustand";
import localforage from "localforage";
import {AnimationSpeed, DisplayDirection, graphvizForEditorOptions} from "@/core/graphviz";

export const MIN_W = 10
export const MIN_H = 10

export const MIN_RESULT_H = 15

export const useEditorSettingsStore = create((set, get) => ({
  init: false,
  setInit: init => set({init}),

  height: 68,
  setHeight: height => {
    set({height: Math.max(MIN_H, height)})
  },

  width: 50,
  setWidth: width => set({width: Math.max(MIN_W, width)}),

  resultHeight: MIN_RESULT_H,
  setResultHeight: resultHeight => set({resultHeight: Math.max(MIN_RESULT_H, resultHeight)}),

  executionServer: "",
  setExecutionServer: executionServer => set({executionServer}),

  monacoOptions: {
    minimap: {enabled: false},
    fontSize: 14
  },
  setMonacoOptions: monacoOptions => set({monacoOptions}),

  monacoTheme: "",
  setMonacoTheme: monacoTheme => set({monacoTheme}),

  graphviz: {
    preview: graphvizForEditorOptions,
    engine: "dot",
    performanceMode: false,
    direction: DisplayDirection.Auto,
    animationSpeed: AnimationSpeed.Fast,
  },
  setGraphviz: graphviz => set({graphviz}),


  initOnLoad: async () => {
    const settings = await localforage.getItem("editor_settings")
    if (settings) {
      set({...settings, init: true})
    }
  },

  syncOnSave: async () => {
    const {
      height,
      width,
      resultHeight,
      monacoOptions,
      monacoTheme,
      graphviz,
      executionServer,

      init
    } = get()

    if (!init) {
      return
    }

    const save = {
      height,
      width,
      resultHeight,
      monacoOptions,
      monacoTheme,
      graphviz,
      executionServer
    }


    await localforage.setItem("editor_settings", save)
  },

  setSettings: ({height, width, monacoOptions, monacoTheme, graphviz, resultHeight, executionServer}) => {
    set({height, width, monacoOptions, monacoTheme, graphviz, resultHeight, executionServer})
  }
}))