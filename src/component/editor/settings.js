import {
  ActionIcon, Anchor,
  Button,
  Divider,
  FileButton,
  Group, Modal,
  NativeSelect,
  Popover, SimpleGrid, Slider,
  Stack,
  Switch, Table,
  Text, Textarea,
  TextInput, Tooltip
} from "@mantine/core";
import {IconCode, IconDownload, IconEdit, IconMinus, IconPlus, IconTrash, IconUpload} from "@tabler/icons-react";
import {MAX_POLL_WAIT, MIN_H, MIN_POLL_WAIT, MIN_W, useEditorSettingsStore} from "@/state/editorSettingsStore";
import thirdPartyThemes from "../../../resource/theme_manifest.json"
import {useEffect, useMemo, useState} from "react";
import {downloadTextFile} from "@/lib/dom";
import {animationSpeedOptions, availableGraphvizEngines, displayDirectionOptions} from "@/core/graphviz";
import {useDebouncedValue} from "@mantine/hooks";
import {useEditorExecutionStore} from "@/state/editorExecutionStore";
import {snippetLabelSet} from "@/core/monaco/completion";
import {useRouter} from "next/router";

const CodeSnippetModal = ({opened, onClose}) => {
  const [editingSnippet, setEditingSnippet] = useState(null)
  const {editCustomSnippet, customSnippets, removeCustomSnippet} = useEditorSettingsStore()

  const onCreate = () => {
    setEditingSnippet({label: "", insertText: ""})
  }

  const trimmedLabel = editingSnippet?.label.trim()

  const onSave = () => {
    editCustomSnippet(trimmedLabel, editingSnippet.insertText)
    setEditingSnippet(null)
  }


  const isInvalid = editingSnippet && (!trimmedLabel || !editingSnippet.insertText.trim())

  return (
    <Modal size={"lg"} opened={opened} onClose={onClose} title="Manage Code Snippets" centered>
      {editingSnippet
        ? (
          <Stack>
            <TextInput
              label={"Snippet Label"}
              placeholder={"Keyword that triggers this snippet"}
              description={"Should be unique and will overwrite previous on duplication"}
              value={editingSnippet.label}
              onChange={e => setEditingSnippet({...editingSnippet, label: e.currentTarget.value})}
              error={snippetLabelSet.has(trimmedLabel) ? "snippet label already existed as builtin" : null}
            />
            <Textarea
              label={"Code"}
              placeholder={"Snippet content"}
              description={<>The content of the snippet template which takes the same <Anchor size={"sm"} target={"_blank"} href={"https://code.visualstudio.com/docs/editor/userdefinedsnippets"}>syntax</Anchor> as VSCode</>}
              value={editingSnippet.insertText}
              onChange={e => setEditingSnippet({...editingSnippet, insertText: e.currentTarget.value})}
              resize="vertical"
              autosize
            />
            <Group grow>
              <Button onClick={onSave} disabled={isInvalid}>Save</Button>
              <Button variant={"default"} onClick={() => setEditingSnippet(null)} >Cancel</Button>
            </Group>
          </Stack>
        )
        : (
          <Stack>
            <Text c={"dimmed"} size={"sm"}>
              Code snippet are template of code that can be inserted into editor by entering its label. The syntax of code snippet is equivalent with VSCode. <Anchor href={"https://code.visualstudio.com/docs/editor/userdefinedsnippets"} target={"_blank"} size={"sm"}>Learn more</Anchor>
            </Text>
            <Group>
              <Button onClick={onCreate}>Create</Button>
            </Group>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Label</Table.Th>
                  <Table.Th>Code</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {customSnippets.map((sn, idx) => {
                  return (
                    <Table.Tr key={idx}>
                      <Table.Td>{sn.label}</Table.Td>
                      <Table.Td>{sn.insertText.slice(0, 16)}{sn.insertText.length > 16 ? "..." : ""}</Table.Td>
                      <Table.Td>
                        <Group>
                          <Tooltip label={"Edit"}>
                            <ActionIcon variant={"default"} onClick={() => setEditingSnippet(sn)}>
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={"Remove"}>
                            <ActionIcon variant={"outline"} color={"red"} onClick={() => removeCustomSnippet(idx)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Stack>
        )
      }
    </Modal>
  )
}

const themeSelectData = [
  {title: "Default", ident: ""},
  ...thirdPartyThemes
].map(({title, ident}) => {
  return {
    label: title,
    value: ident
  }
})

export const SettingsPopover = ({children, opened, onChange}) => {
  const {
    height, width,
    monacoOptions,
    setMonacoOptions,
    setHeight,
    monacoTheme, setMonacoTheme,
    setWidth,
    setSettings,
    graphviz, setGraphviz,
    executionServer, setExecutionServer,
    execPollWait, setExecPollWait,
    editorCodeOptions, setEditorCodeOptions,
    resultHeight,
    customSnippets

  } = useEditorSettingsStore()
  // const [isLoadingTheme, setIsLoadingTheme] = useState(false)
  const [customSnippetModalOpened, setCustomSnippetModalOpened] = useState(false)
  const [uExecServer, setUExecServer] = useState(executionServer)
  const [debouncedExecServer] = useDebouncedValue(uExecServer, 200)
  const {isLoading, pollId} = useEditorExecutionStore()
  const router = useRouter()
  // const {monacoCtx} = useEditorStore()

  const minHeight = height <= MIN_H
  const minWidth = width <= MIN_W
  const minFontSize = monacoOptions.fontSize <= 8

  const execServerValid = useMemo(() => uExecServer.trim().length === 0 || /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(uExecServer), [uExecServer])


  const isExec = useMemo(() => {
    return isLoading || !!pollId
  }, [isLoading, pollId])


  useEffect(() => {
    if (execServerValid) {
      setExecutionServer(debouncedExecServer)
    }
  }, [debouncedExecServer]);

  useEffect(() => {
    if (!uExecServer) {
      setUExecServer(executionServer)
    }
  }, [executionServer]);

  const exportSettings = () => {
    const content = {
      width, height,
      monacoOptions, monacoTheme,
      executionServer, execPollWait,
      editorCodeOptions, graphviz,
      resultHeight,
      customSnippets
    }

    downloadTextFile(JSON.stringify(content), "settings.json")
  }

  const importSettings = async file => {
    if (file) {
      const settings = JSON.parse(await file.text())
      if (!settings) {return}
      setSettings(settings)
    }
  }
  // 280
  return (
    <>
      <Popover opened={opened} onChange={onChange} onClose={() => onChange(false)} width={600} trapFocus position="bottom" withArrow shadow="md">
        <Popover.Target children={children} />
        <Popover.Dropdown>
          <Stack>
            <SimpleGrid cols={2}>
              <Stack>
                <Text fw={700}>Code Editor</Text>
                <NativeSelect
                  label={"Theme"}
                  data={themeSelectData}
                  value={monacoTheme}
                  onChange={e => setMonacoTheme(e.currentTarget.value)}
                />

                <Switch
                  label={"Code Minimap"}
                  checked={monacoOptions.minimap.enabled}
                  onChange={e => setMonacoOptions({
                    ...monacoOptions,
                    minimap: {enabled: e.currentTarget.checked}
                  })}
                />

                <Switch
                  label={"Word Wrap"}
                  checked={monacoOptions.wordWrap === "on"}
                  onChange={e => setMonacoOptions({...monacoOptions, wordWrap: e.currentTarget.checked ? "on" : "off"})}
                />

                <Switch
                  label={"Code Lens For Nodes"}
                  checked={editorCodeOptions.lensStateEnabled}
                  onChange={e => {
                    setEditorCodeOptions({
                      ...editorCodeOptions,
                      lensStateEnabled: e.currentTarget.checked
                    })
                  }}
                />

                <Switch
                  label={"Code Lens For Edges"}
                  checked={editorCodeOptions.lensTransEnabled}
                  onChange={e => {
                    setEditorCodeOptions({
                      ...editorCodeOptions,
                      lensTransEnabled: e.currentTarget.checked
                    })
                  }}
                />

                <Group justify={"space-between"}>
                  <ActionIcon
                    variant={"default"}
                    disabled={minFontSize}
                    onClick={() => setMonacoOptions({...monacoOptions, fontSize: monacoOptions.fontSize - 1})}
                  >
                    <IconMinus />
                  </ActionIcon>
                  <Text style={{userSelect: "none"}} size={"sm"}>Font Size: {monacoOptions.fontSize}</Text>
                  <ActionIcon
                    variant={"default"}
                    onClick={() => setMonacoOptions({...monacoOptions, fontSize: monacoOptions.fontSize + 1})}
                  >
                    <IconPlus />
                  </ActionIcon>
                </Group>

                <Group justify={"space-between"}>
                  <ActionIcon disabled={minHeight} variant={"default"} onClick={() => setHeight(height - 5)}><IconMinus /></ActionIcon>
                  <Text size={"sm"} style={{userSelect: "none"}}>Editor Height</Text>
                  <ActionIcon variant={"default"} onClick={() => setHeight(height + 5)}><IconPlus /></ActionIcon>
                </Group>

                <Group justify={"space-between"}>
                  <ActionIcon disabled={minWidth} variant={"default"} onClick={() => setWidth(width - 5)}><IconMinus /></ActionIcon>
                  <Text size={"sm"} style={{userSelect: "none"}}>Editor Width</Text>
                  <ActionIcon variant={"default"} onClick={() => setWidth(width + 5)}><IconPlus /></ActionIcon>
                </Group>

                <Divider />

                <Group maw={240}>
                  <TextInput
                    label={"Execution Server"}
                    description={<>
                      Define preferred server to check Cyclone spec remotely. Server could be <a target={`_blank`} href={"https://github.com/lucid-brndmg/cyclone-online-editor?tab=readme-ov-file#execution-server-1"}>deployed locally</a>
                    </>}
                    placeholder={"https://..."}
                    onChange={e => setUExecServer(e.currentTarget.value)}
                    value={uExecServer}
                    error={execServerValid ? "" : "Invalid url format"}
                    disabled={isExec}
                  />
                </Group>

                <div>
                  <Text size={"sm"}>Queue Mode Polling Timeout</Text>
                  <Slider
                    disabled={isExec}
                    maw={220}
                    value={execPollWait}
                    onChange={setExecPollWait}
                    label={(value) => `${value} Sec (${Math.round(value / 60)} min)`}
                    min={MIN_POLL_WAIT}
                    max={MAX_POLL_WAIT}
                  />
                  <Text size={"xs"} c={"dimmed"}>
                    Timeout for polling result from execution under <b>queue mode</b>.
                  </Text>
                </div>

              </Stack>

              {/* <Divider orientation={"vertical"} /> */}

              <Stack>
                <Text fw={700}>Visualization</Text>

                <NativeSelect
                  label={"Engine"}
                  data={availableGraphvizEngines}
                  value={graphviz.engine}
                  onChange={e => setGraphviz({...graphviz, engine: e.currentTarget.value})}
                />
                <NativeSelect
                  label={"Direction"}
                  data={displayDirectionOptions}
                  value={graphviz.direction}
                  onChange={e => setGraphviz({...graphviz, direction: e.currentTarget.value})}
                />

                <NativeSelect
                  label={"Animations"}
                  data={animationSpeedOptions}
                  value={graphviz.animationSpeed}
                  onChange={e => setGraphviz({...graphviz, animationSpeed: e.currentTarget.value})}
                />

                <Switch
                  label={"Display node modifiers"}
                  checked={graphviz.preview.showNodeProps}
                  onChange={e => setGraphviz({
                    ...graphviz,
                    preview: {...graphviz.preview, showNodeProps: e.currentTarget.checked}
                  })}
                />
                <Switch
                  label={"Display detailed expressions"}
                  checked={graphviz.preview.showDetailedExpressions}
                  onChange={e => setGraphviz({
                    ...graphviz,
                    preview: {...graphviz.preview, showDetailedExpressions: e.currentTarget.checked}
                  })}
                />
                <Switch
                  label={"Display edge description"}
                  checked={graphviz.preview.showEdgeDesc}
                  onChange={e => setGraphviz({
                    ...graphviz,
                    preview: {...graphviz.preview, showEdgeDesc: e.currentTarget.checked}
                  })}
                />
                <Switch
                  label={"Display invariants"}
                  checked={graphviz.preview.showInvariant}
                  onChange={e => setGraphviz({
                    ...graphviz,
                    preview: {...graphviz.preview, showInvariant: e.currentTarget.checked}
                  })}
                />

                <Switch
                  label={"Display assertions"}
                  checked={graphviz.preview.showAssertion}
                  onChange={e => setGraphviz({
                    ...graphviz,
                    preview: {...graphviz.preview, showAssertion: e.currentTarget.checked}
                  })}
                />

                <Switch
                  label={"Display goal"}
                  checked={graphviz.preview.showGoal}
                  onChange={e => setGraphviz({
                    ...graphviz,
                    preview: {...graphviz.preview, showGoal: e.currentTarget.checked}
                  })}
                />
                <Switch
                  label={"Set padding on edge's text"}
                  checked={graphviz.preview.paddingEdgeText}
                  onChange={e => setGraphviz({
                    ...graphviz,
                    preview: {...graphviz.preview, paddingEdgeText: e.currentTarget.checked}
                  })}
                />
                <Switch
                  label={"Display expressions using math symbols"}
                  checked={graphviz.preview.showAsMathOperators}
                  onChange={e => setGraphviz({
                    ...graphviz,
                    preview: {...graphviz.preview, showAsMathOperators: e.currentTarget.checked}
                  })}
                />
                <Switch
                  label={"Performance Mode"}
                  checked={graphviz.performanceMode}
                  onChange={e => setGraphviz({
                    ...graphviz,
                    performanceMode: e.currentTarget.checked
                  })}
                />
              </Stack>
            </SimpleGrid>

            <Divider />

            <Text c={"dimmed"} size={"sm"}>
              <b>Tip: </b> Drag the border of the editor section / execution result section to modify the width & height.
            </Text>

            <Group grow>
              <Button variant={"default"} onClick={() => {
                setCustomSnippetModalOpened(true)
                onChange(false)
              }} leftSection={<IconCode size={14} />}>
                Code Snippets
              </Button>
              <FileButton onChange={importSettings} accept=".json">
                {(props) => <Button {...props} variant={"default"} leftSection={<IconUpload size={14} />}>Import</Button>}
              </FileButton>
              <Button  variant={"default"} leftSection={<IconDownload size={14} />} onClick={exportSettings}>Export</Button>
            </Group>
          </Stack>
        </Popover.Dropdown>
      </Popover>
      <CodeSnippetModal opened={customSnippetModalOpened} onClose={() => setCustomSnippetModalOpened(false)} />
    </>
  )
}