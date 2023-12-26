import {useEditorStore} from "@/state/editorStore";
import {useRouter} from "next/router";
import localforage from "localforage";
import {Button, FileButton, Group, NumberInput, Popover, Stack} from "@mantine/core";
import {
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
  IconCursorText,
  IconDownload,
  IconFolderOpen,
  IconPlayerPlay,
  IconSettings, IconShare2,
  IconShare3
} from "@tabler/icons-react";
import {downloadTextFile} from "@/lib/dom";
import {CodeExecutionButton} from "@/component/editor/execution";
import {FileSaveButton, FileStatusBar, NewFileButton} from "@/component/editor/storage";
import {SettingsPopover} from "@/component/editor/settings";
import {locateToCode} from "@/core/utils/monaco";
import {pos} from "@/lib/position";
import {sieveCount} from "@/lib/list";
import {useMemo, useState} from "react";
import {isWarning} from "@/core/specification";
import {SharePopover} from "@/component/share/popover";

const OpenInPlaygroundButton = () => {
  const {code} = useEditorStore()
  const router = useRouter()

  const onOpen = async () => {
    await localforage.setItem("tmp_code", code)
    await router.push("/playground")
  }

  return (
    <Button onClick={onOpen} leftSection={<IconShare3 />} variant={"outline"} color={"blue"}>Open in Playground</Button>
  )
}

const ShareButton = () => {
  const [opened, setOpened] = useState(false)
  return (
    <SharePopover opened={opened} onChange={setOpened}>
      <Button leftSection={<IconShare3 />} onClick={() => setOpened(!opened)} variant={"default"}>Share</Button>
    </SharePopover>
  )
}

export const Toolbar = ({
  light = false
}) => {
  const {code, setCode} = useEditorStore()

  const onUpload = async file => {
    if (file) {
      setCode(await file.text())
    }
  }
  const onDownload = () => downloadTextFile(code, "file.cyclone")

  return (
    <Group justify={"space-between"}>
      <Group>
        <CodeExecutionButton
          leftSection={<IconPlayerPlay />}
          color={"green"}
        />
        {
          light
            ? null
            : <FileStatusBar />
        }
      </Group>

      <Button.Group>
        {
          light ? null : <NewFileButton />
        }
        <FileButton onChange={onUpload} accept=".cyclone,.txt">
          {(props) => <Button {...props} leftSection={<IconFolderOpen />} variant={"default"}>Upload</Button>}
        </FileButton>
        {light
          ? null
          : <FileSaveButton />
        }
        <Button leftSection={<IconDownload />} variant={"default"} disabled={code === ""} onClick={onDownload}>Download</Button>
        {/* <SettingsPopover> */}
        {/*   <Button leftSection={<IconSettings />} variant={"default"}>Settings</Button> */}
        {/* </SettingsPopover> */}
      </Button.Group>

      {
        light ? <OpenInPlaygroundButton /> : <ShareButton />
      }


    </Group>
  )
}

const PositionLocator = () => {
  const [line, setLine] = useState(1)
  const [column, setColumn] = useState(1)
  const isValid = line >= 1 && column >= 1

  const {monacoCtx, position} = useEditorStore()

  const onReveal = () => {
    if (monacoCtx?.editor) {
      locateToCode(monacoCtx.editor, {line, column})
    }
  }

  return (
    <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Button size={"compact-sm"} variant={"subtle"} leftSection={<IconCursorText size={16} />} color={"gray"}>{position.line} : {position.column}</Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack>
          <Group justify={"space-between"}>
            <NumberInput
              placeholder={"Line"}
              maw={120}
              value={line}
              label={"Line"}
              onChange={setLine}
              min={1}
            />
            <NumberInput
              placeholder={"Column"}
              label={"Column"}
              maw={120}
              onChange={setColumn}
              value={column}
              min={1}
            />
          </Group>
          <Button fullWidth={true} disabled={!isValid} onClick={() => onReveal(pos(line, column))}>Goto position</Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

export const StatusBar = () => {
  const {errors} = useEditorStore()
  const [errorCount, warningCount] = useMemo(() => sieveCount(errors, e => !isWarning(e.type)), [errors])

  return (
    <Group justify={"space-between"}>
      <Group style={{userSelect: "none"}}>
        <Group fz={"sm"} style={{display: errorCount > 0 ? "" : "none"}} gap={"4px"} c={"red"}>
          <IconAlertCircleFilled size={16}/>
          {errorCount} Errors
        </Group>
        <Group fz={"sm"} style={{display: warningCount > 0 ? "" : "none"}} gap={"4px"} c={"orange"}>
          <IconAlertTriangleFilled size={16}/>
          {warningCount} Warnings
        </Group>
      </Group>
      <PositionLocator />
    </Group>
  )
}