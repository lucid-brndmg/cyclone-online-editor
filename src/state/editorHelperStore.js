import {create} from "zustand";

export const useEditorHelperStore = create((set, get) => ({

  helperTab: "browser",
  setHelperTab: helperTab => set({helperTab}),

  structureOutline: null,
  setStructureOutline: structureOutline => set(() => ({structureOutline}))

}))