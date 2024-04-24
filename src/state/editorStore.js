import {create} from "zustand";
import {pos} from "@/lib/position";

export const useEditorStore = create((set, get) => ({
  code: "",
  setCode: code => set(() => ({ code })),

  position: pos(1, 1),
  setPosition: position => set(() => ({position})),

  errors: [],
  setErrors: errors => set(() => ({errors})),

  editorCtx: null,
  setEditorCtx: editorCtx => set(() => ({editorCtx})),

  monacoCtx: null,
  setMonacoCtx: monacoCtx => set(() => ({monacoCtx})),

  editorReady: false,
  setEditorReady: editorReady => set({editorReady}),

  isAnalyzerError: false,
  setIsAnalyzerError: isAnalyzerError => set({isAnalyzerError})
}))