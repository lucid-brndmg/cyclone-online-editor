import {create} from "zustand";
import localforage from "localforage";
import {randomId} from "@/lib/random";
import JSZip from "jszip";

const assignSaveId = () => `sav-${randomId(8)}`

export const isManifest = id => id.startsWith("man-")

export const useEditorPersistentStore = create((set, get) => ({
  newFileCreated: 0,
  setNewFileCreated: newFileCreated => set({newFileCreated}),

  currentFileId: null,
  setCurrentFileId: currentFileId => set(() => ({currentFileId})),

  switchFileId: undefined,
  setSwitchFileId: switchFileId => set(() => ({switchFileId})),

  // isSaved: true,
  // setIsSaved: isSaved => set(() => ({isSaved})),

  fileTable: null,
  // setFileTable: fileTable => set(() => ({fileTable})),

  // isLoadingCodeExample: false,
  // setIsLoadingCodeExample: isLoadingCodeExample => set({isLoadingCodeExample}),

  initOnPageLoad: async () => {
    const table = await localforage.getItem("saved_code_table") || {}

    set({
      fileTable: table
    })
  },

  saveCurrent: async (title, code) => {
    let {currentFileId, fileTable} = get()
    let idChanged = false
    if (!currentFileId || isManifest(currentFileId)) {
      currentFileId = assignSaveId()
      idChanged = true
    }
    await localforage.setItem(currentFileId, code)

    const newFileTable = {...fileTable}
    newFileTable[currentFileId] = {title, time: Date.now()}
    await localforage.setItem("saved_code_table", newFileTable)
    const update = {
      fileTable: newFileTable,
    }
    if (idChanged) {
      update.currentFileId = currentFileId
    }
    set(update)
  },

  renameOne: async (id, name) => {
    const {fileTable} = get()
    if (fileTable[id]) {
      const newTable = {...fileTable}
      newTable[id] = {
        ...fileTable[id],
        title: name
      }

      await localforage.setItem("saved_code_table", newTable)
      set({fileTable: newTable})
    }
  },

  exportAll: async () => {
    const {fileTable} = get()
    const ids = Object.keys(fileTable)
    if (ids.length) {
      const tasks = []
      const zip = new JSZip()
      for (let id of ids) {
        const {title} = fileTable[id]
        tasks.push(
          localforage
            .getItem(id)
            .then(content => zip.file(`${title}.cyclone`, content))
        )
      }

      await Promise.all(tasks)
      return await zip.generateAsync({
        type: "blob"
      })
    }

    return null
  },

  deleteOne: async id => {
    const {fileTable, currentFileId} = get()
    if (fileTable[id] && id !== currentFileId) {
      const newFileTable = {...fileTable}
      delete newFileTable[id]

      await localforage.removeItem(id)
      await localforage.setItem("saved_code_table", newFileTable)
      set({fileTable: newFileTable})

      return true
    }

    return false
  },

  loadOne: async id => await localforage.getItem(id)
}))

export const useEditorSaveStatusStore = create((set) => ({
  isSaved: true,
  setIsSaved: isSaved => set(() => ({isSaved})),
}))