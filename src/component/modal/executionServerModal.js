import {useEffect, useMemo, useState} from "react";
import {Button, Group, Modal, Stack, TextInput, Text, Anchor} from "@mantine/core";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";

const ExecutionServerModal = () => {
  const [opened, setOpened] = useState(false)
  const [address, setAddress] = useState("")
  const {setExecutionServer, executionServer, init} = useEditorSettingsStore()
  const [openedOnce, setOpenedOnce] = useState(false)

  const execServerValid = useMemo(() => address?.trim().length && /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(address), [address])

  useEffect(() => {
    if (!init || openedOnce) {
      return
    }
    const params = new URLSearchParams(window.location.search)
    const execServer = params.get("set_exec_server")
    if (execServer) {
      let trimmed = execServer.trim()
      if (executionServer.trim() !== trimmed) {
        setOpened(true)
        setAddress(trimmed)
      }
    }
  }, [init, executionServer]);

  useEffect(() => {
    if (opened) {
      setOpenedOnce(true)
    }
  }, [opened]);

  const onClose = () => setOpened(false)
  const onSave = () => {
    setAddress("")
    if (execServerValid) {
      setExecutionServer(address)
    }
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Set Execution Server" centered>
      <Stack>
        <TextInput
          label={"Set Execution Server Address To"}
          value={address}
          onChange={e => setAddress(e.currentTarget.value)}
        />

        <Text size={"sm"} c={"dimmed"}>
          This window is only shown when a local instance of Cyclone execution server is started or someone sent you this URL to share their instance of the execution server.
          <br/><br/>
          Your specs will be sent to this server when "Run" button was clicked. Be sure that this server <b>can be trusted</b> first. <Text span c={"orange"}>DO NOT click save if you DON'T know what this address is about!</Text>
        </Text>
        <Group justify={"space-between"}>
          <Anchor size={"sm"} href={"https://github.com/lucid-brndmg/cyclone-online-editor?tab=readme-ov-file#execution-server-1"} target={"_blank"} >Learn More</Anchor>
          <Group >
            <Button variant={"default"} onClick={onClose}>Cancel</Button>
            <Button disabled={!execServerValid} onClick={onSave}>Save</Button>
          </Group>
        </Group>

      </Stack>
    </Modal>
  )
}

export default ExecutionServerModal