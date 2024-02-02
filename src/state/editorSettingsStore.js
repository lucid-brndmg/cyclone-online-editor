import {create} from "zustand";
import localforage from "localforage";
import {AnimationSpeed, DisplayDirection, graphvizForEditorOptions} from "@/core/graphviz";

export const MIN_W = 10
export const MIN_H = 10

export const MIN_RESULT_H = 27

export const MIN_POLL_WAIT = 5
export const MAX_POLL_WAIT = 60
const DEFAULT_POLL_WAIT = 30


export const useEditorSettingsStore = create((set, get) => ({
  init: false,
  setInit: init => set({init}),

  height: 45,
  setHeight: height => {
    set({height: Math.max(MIN_H, height)})
  },

  width: 50,
  setWidth: width => set({width: Math.max(MIN_W, width)}),

  resultHeight: MIN_RESULT_H,
  setResultHeight: resultHeight => set({resultHeight: Math.max(MIN_RESULT_H, resultHeight)}),

  executionServer: "",
  setExecutionServer: executionServer => set({executionServer}),

  execPollWait: DEFAULT_POLL_WAIT,
  setExecPollWait: execPollWait => set({execPollWait}),

  monacoOptions: {
    minimap: {enabled: false},
    fontSize: 14,
  },
  setMonacoOptions: monacoOptions => set({monacoOptions}),

  editorCodeOptions: {
    lensStateEnabled: true,
    lensTransEnabled: true
  },
  setEditorCodeOptions: editorCodeOptions => set({editorCodeOptions}),

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
      editorCodeOptions,
      monacoTheme,
      graphviz,
      executionServer,
      execPollWait,
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
      editorCodeOptions,
      monacoTheme,
      graphviz,
      executionServer,
      execPollWait
    }


    await localforage.setItem("editor_settings", save)
  },

  setSettings: ({height, width, monacoOptions, editorCodeOptions, monacoTheme, graphviz, resultHeight, executionServer, execPollWait}) => {
    set({height, width, monacoOptions, editorCodeOptions, monacoTheme, graphviz, resultHeight, executionServer, execPollWait})
  }
}))