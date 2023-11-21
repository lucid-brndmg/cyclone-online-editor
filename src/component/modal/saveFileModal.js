import {useState} from "react";
import {Button, Checkbox, Group, Modal, Stack, TextInput} from "@mantine/core";
import {useEditorPersistentStore, useEditorSaveStatusStore} from "@/state/editorPersistentStore";
import {useEditorStore} from "@/state/editorStore";
import {downloadTextFile} from "@/lib/dom";

export const SaveFileModal = ({opened, onOpened}) => {
  const [title, setTitle] = useState("")
  const [isDownload, setIsDownload] = useState(false)

  const {setIsSaved} = useEditorSaveStatusStore()
  const {saveCurrent} = useEditorPersistentStore()
  const {code} = useEditorStore()

  const onClose = () => onOpened(false)
  const onSave = async () => {
    await saveCurrent(title, code)
    setIsSaved(true)
    if (isDownload) {
      downloadTextFile(code, `${title}.cyclone`)
    }
    onClose()
  }

  const isValid = title.trim().length > 0

  return (
    <Modal opened={opened} onClose={onClose} title="Save File" centered>
      <Stack>
        <TextInput
          label={"Filename"}
          value={title}
          onChange={e => setTitle(e.currentTarget.value)}
        />

        <Checkbox
          label={"Download a copy"}
          checked={isDownload}
          onChange={e => setIsDownload(e.currentTarget.checked)}
        />

        <Group justify={"right"}>
          <Button variant={"default"} onClick={onClose}>Cancel</Button>
          <Button disabled={!isValid} onClick={onSave}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  )
}