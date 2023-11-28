import {create} from "zustand";
import Config from "../../resource/config.json"

export const useEditorHelperStore = create((set, get) => ({

  helperTab: Config.editor.playgroundDefaultTab,
  setHelperTab: helperTab => set({helperTab}),

  structureOutline: null,
  setStructureOutline: structureOutline => set(() => ({structureOutline}))

}))