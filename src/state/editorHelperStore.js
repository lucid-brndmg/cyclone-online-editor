import {create} from "zustand";
import Config from "../../resource/config.json"

export const useEditorHelperStore = create((set, get) => ({

  helperTab: Config.editor.playgroundDefaultTab,
  setHelperTab: helperTab => set({helperTab}),

  outlineTab: "structure",
  setOutlineTab: outlineTab => set({outlineTab})
}))