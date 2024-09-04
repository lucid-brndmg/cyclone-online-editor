import {Box, Button, Group, Text} from "@mantine/core";
import {isManifest, useEditorPersistentStore, useEditorSaveStatusStore} from "@/state/editorPersistentStore";
import {useEditorStore} from "@/state/editorStore";
import {useEffect, useMemo, useState} from "react";
import {IconDeviceFloppy, IconFile, IconFilePlus} from "@tabler/icons-react";
import {codeExampleTable} from "@/core/resources/codeExample";
import SaveFileModal from "@/component/modal/saveFileModal";
import {locateToCode} from "@/core/utils/monaco";
import {modals} from "@mantine/modals";

export const FileStatusBar = () => {
  const {currentFileId, fileTable} = useEditorPersistentStore()
  const {code} = useEditorStore()
  const {setIsSaved, isSaved} = useEditorSaveStatusStore()

  useEffect(() => {
    setIsSaved(false)
  }, [code])

  const filename = useMemo(() => {
    if (!currentFileId) {
      return "New"
    }

    if (isManifest(currentFileId)) {
      return codeExampleTable[currentFileId].title
    }

    if (fileTable) {
      return fileTable[currentFileId].title
    }

    return ""
  }, [fileTable, currentFileId])

  return (
    <Group gap={8}>
      <IconFile />
      <Box>
        <Text fw={500} size={"sm"}>{filename}{isSaved ? "" : " *"}</Text>
        <Text style={{display: isSaved ? "none" : ""}} size={"xs"} c={"dimmed"}>(not saved)</Text>
      </Box>
    </Group>
  )
}

export const FileSaveButton = () => {
  const {currentFileId, saveCurrent, fileTable} = useEditorPersistentStore()
  const {isSaved, setIsSaved} = useEditorSaveStatusStore()
  const [modalOpened, setModalOpened] = useState(false)
  const {code} = useEditorStore()

  const onSave = async () => {
    if (currentFileId && !isManifest(currentFileId)) {
      await saveCurrent(fileTable[currentFileId].title, code)
      setIsSaved(true)
    } else {
      setModalOpened(true)
    }
  }

  return (
    <>
      <SaveFileModal
        opened={modalOpened}
        onOpened={setModalOpened}
      />
      <Button
        leftSection={<IconDeviceFloppy />}
        variant={"default"}
        disabled={isSaved}
        onClick={onSave}
      >
        Save
      </Button>

    </>
  )
}

export const NewFileButton = () => {
  const {setSwitchFileId, currentFileId, setNewFileCreated} = useEditorPersistentStore()
  const {monacoCtx, code} = useEditorStore()

  const openClearNewFileModal = () => modals.openConfirmModal({
    title: "Change Unsaved",
    children: (
      <Text size={"sm"}>
        Changes unsaved, by continue will lost your progress.
      </Text>
    ),
    labels: {confirm: "Continue", cancel: "Cancel"},
    onConfirm: () => setNewFileCreated(Date.now())
  })

  const createFile = () => {
    if (currentFileId !== null) {
      setSwitchFileId(null)
    } else {
      openClearNewFileModal()
    }
    locateToCode(monacoCtx.editor, {line: 1, column: 1})
  }

  return (
    <Button
      leftSection={<IconFilePlus />}
      variant={"default"}
      onClick={createFile}
      // disabled={currentFileId === null}
      disabled={currentFileId === null && !code.length}
    >
      New File
    </Button>
  )
}