import {Accordion, ActionIcon, Button, Checkbox, Group, LoadingOverlay, NavLink, Stack, Text} from "@mantine/core";
import examples from "../../../resource/code_example_manifest.json"
import {useEditorStore} from "@/state/editorStore";
import {locateToCode} from "@/core/utils/monaco";
import {IconBulb, IconDownload, IconFile, IconTrash} from "@tabler/icons-react";
import {useEditorPersistentStore, useEditorSaveStatusStore} from "@/state/editorPersistentStore";
import {useEffect, useMemo, useState} from "react";
import {timeDifference} from "@/lib/time";
import {codeExampleTable} from "@/core/resources/codeExample";
import {downloadBlobFile} from "@/lib/dom";
import {modals} from "@mantine/modals";
import {dynamicCodeExample, PublicUrl} from "@/core/utils/resource";
import localforage from "localforage";
import {useRouter} from "next/router";
import {useGraphvizStore} from "@/state/editorGraphvizStore";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";

export const FileStateWrapper = () => {
  const {setCode, monacoCtx} = useEditorStore()
  const {
    currentFileId,
    initOnPageLoad,
    fileTable,
    loadOne,
    newFileCreated,
    switchFileId,
    setSwitchFileId,
    setCurrentFileId
  } = useEditorPersistentStore()
  const {setIsSaved, isSaved} = useEditorSaveStatusStore()
  const [isLoadingCodeExample, setIsLoadingCodeExample] = useState(false)
  const [saveFlag, setSaveFlag] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initOnPageLoad()
      .then(async () => {
        if (router.pathname === PublicUrl.EditorBase) {
          const code = await localforage.getItem("tmp_code")
          if (code) {
              setCode(code)
              // setTimeout(() => setCode(code), 100)
              setIsSaved(false)
            // await localforage.removeItem("tmp_code")
            return
          }
        }

        setIsSaved(true)
      })
  }, []);

  useEffect(() => {
    if (monacoCtx?.editor) {
      if (!currentFileId) {
        setCode("")
        setSaveFlag(!saveFlag)
        // requestAnimationFrame(() => setIsSaved(true))
      } else if (codeExampleTable[currentFileId]) {
        setIsLoadingCodeExample(true)
        fetch(dynamicCodeExample(currentFileId)).then(async resp => {
          const code = await resp.text()
          setIsLoadingCodeExample(false)
          setCode(code)
          locateToCode(monacoCtx.editor, {line: 1, column: 1})
          setSaveFlag(!saveFlag)
          // requestAnimationFrame(() => setIsSaved(true))
        }).catch(e => {
          console.log(e)
          setIsLoadingCodeExample(false)
        })
        // setCode(codeExampleTable[currentFileId].code)

        // setTimeout(() => setIsSaved(true), 10)
      } else if (fileTable && fileTable[currentFileId]) {
        loadOne(currentFileId).then(code => {
          setCode(code)
          locateToCode(monacoCtx.editor, {line: 1, column: 1})
          setSaveFlag(!saveFlag)
          // setTimeout(() => setIsSaved(true), 10)
        })
      }
    }
  }, [currentFileId, newFileCreated])

  const openSwitchUnsavedModal = () => modals.openConfirmModal({
    title: 'Change Unsaved',
    children: (
      <Text size="sm">
        Changes unsaved, by continue will lost your progress.
      </Text>
    ),
    labels: { confirm: 'Continue', cancel: 'Cancel' },
    onCancel: () => {
      setSwitchFileId(undefined)
    },
    onConfirm: () => {
      setCurrentFileId(switchFileId)
      setSwitchFileId(undefined)
    },
  });

  useEffect(() => {
    if (switchFileId !== undefined && !isSaved) {
      openSwitchUnsavedModal()
    } else if (switchFileId !== undefined) {
      setCurrentFileId(switchFileId)
      setSwitchFileId(undefined)
    }
  }, [switchFileId]);

  useEffect(() => {
    setIsSaved(true)
  }, [saveFlag]);

  return (
    <LoadingOverlay visible={isLoadingCodeExample} />
  )
}

export const BrowserPanel = () => {
  const [deletionId, setDeletionId] = useState(null)
  const {
    setCurrentFileId,
    currentFileId,
    fileTable,
    deleteOne,
    exportFiles,
    switchFileId,
    deleteMulti,
    setSwitchFileId,
  } = useEditorPersistentStore()

  const {editorReady} = useEditorStore()
  const {fileBrowserExpanded, setFileBrowserExpanded} = useEditorSettingsStore()
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const now = Date.now()

  const fileList = useMemo(() => Object.entries(fileTable ?? {}).map(([id, value]) => ({
    id,
    ...value
  })).sort((a, b) => b - a), [fileTable])


  const openDeletionOneModal = () => modals.openConfirmModal({
    title: 'Confirm Deletion',
    children: (
      <Text size="sm">
        Are you sure to delete file '{fileTable[deletionId].title}' ?
      </Text>
    ),
    labels: { confirm: 'Confirm', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onCancel: () => setDeletionId(null),
    onConfirm: () => onDeleteOne(),
  });

  const openMultiDeletionModal = () => modals.openConfirmModal({
    title: 'Confirm Deletion',
    children: (
      <Text size="sm">
        Are you sure to delete {selectedFiles.size ? selectedFiles.size : "all"} Files ?
      </Text>
    ),
    labels: { confirm: 'Confirm', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onCancel: () => {},
    onConfirm: () => onDeleteFiles(),
  });

  useEffect(() => {
    if (deletionId) {
      openDeletionOneModal()
    }
  }, [deletionId]);

  const onExportFiles = async () => {
    const zip = await exportFiles(selectedFiles)
    await downloadBlobFile(zip, "files.zip")
  }

  const onDeleteOne = async () => {
    if (deletionId === currentFileId) {
      setCurrentFileId(null)
    }

    await deleteOne(deletionId)
    setDeletionId(null)
  }

  const onDeleteFiles = async () => {
    const ids = selectedFiles.size ? [...selectedFiles] : Object.keys(fileTable)
    if (currentFileId != null && ids.some(id => currentFileId === id)) {
      setCurrentFileId(null)
    }

    await deleteMulti(ids)

    setDeletionId(null)
  }

  const onSelectFile = (e, id) => {
    if (selectedFiles.has(id)) {
      selectedFiles.delete(id)
    } else {
      selectedFiles.add(id)
    }
    setSelectedFiles(new Set(selectedFiles))
  }

  const files = fileList.map(({id, title, time}) => {
    return (
      <NavLink
        disabled={!editorReady}
        key={id}
        label={
          <div>
            <Text size={"sm"}>{title}</Text>
            <Text c={"dimmed"} size={"xs"}>Edited: {timeDifference(now, time)}</Text>
          </div>
        }
        // <IconFile />
        leftSection={<Checkbox
          size={"lg"}
          onClick={e => e.stopPropagation()}
          onChange={e => onSelectFile(e, id)}
          checked={selectedFiles.has(id)}
        />}
        rightSection={<ActionIcon
          size={"sm"}
          color={"red"}
          variant={"subtle"}
          onClick={e => {
            e.stopPropagation()
            setDeletionId(id)
            // onDelete(id)
          }}
        ><IconTrash /></ActionIcon>}
        onClick={() => setSwitchFileId(id)}
        active={currentFileId === id}
      />
    )
  })

  return (
    <Stack>
      {/* <LoadingOverlay visible={isLoadingCodeExample} /> */}

      <Accordion chevronPosition={"right"} multiple={true} value={fileBrowserExpanded} onChange={setFileBrowserExpanded}>
        <Accordion.Item value={"saved"}>
          <Accordion.Control >
            <Text fw={500}>Saved Codes</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack>
              {
                files.length ? <>
                  <Group grow>
                    <Button size={"sm"} leftSection={<IconDownload size={16} />} variant={"default"} onClick={onExportFiles}>Export {selectedFiles.size ? `${selectedFiles.size} Files` : "All"}</Button>
                    <Button onClick={e => {
                      e.stopPropagation()
                      openMultiDeletionModal()
                    }} size={"sm"} variant={"outline"} leftSection={<IconTrash size={16} />} color={"red"}>Delete {selectedFiles.size ? `${selectedFiles.size} Files` : "All"}</Button>
                  </Group>
                  {files}
                </> : <Text c={"dimmed"} size={"sm"}>No files saved yet. Save editing code by clicking 'save' button.</Text>
              }
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value={"examples"}>
          <Accordion.Control >
            <Text fw={500}>Cyclone Examples</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack>
              {/* <Button size={"compact-sm"} leftSection={<IconDownload size={16} />} variant={"default"} onClick={onDownloadExamples}>Download All</Button> */}
              {
                examples.map(({id, title}) => {
                  return (
                    <NavLink
                      disabled={!editorReady}
                      key={id}
                      label={<Text size={"sm"}>{title}</Text>}
                      leftSection={<IconBulb />}
                      onClick={() => setSwitchFileId(id)}
                      active={currentFileId === id}
                    />
                  )
                })
              }
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  )
}