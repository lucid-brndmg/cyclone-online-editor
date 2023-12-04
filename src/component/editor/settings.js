import {
  ActionIcon,
  Button,
  Divider,
  FileButton,
  Group,
  NativeSelect,
  Popover, Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  useComputedColorScheme
} from "@mantine/core";
import {IconDownload, IconMinus, IconPlus, IconUpload} from "@tabler/icons-react";
import {MAX_POLL_WAIT, MIN_H, MIN_POLL_WAIT, MIN_W, useEditorSettingsStore} from "@/state/editorSettingsStore";
import thirdPartyThemes from "../../../resource/theme_manifest.json"
import {useEffect, useMemo, useState} from "react";
import {useEditorStore} from "@/state/editorStore";
import {dynamicTheme} from "@/core/utils/resource";
import {downloadTextFile} from "@/lib/dom";
import {animationSpeedOptions, availableGraphvizEngines, displayDirectionOptions} from "@/core/graphviz";
import {useDebouncedValue} from "@mantine/hooks";
import {useEditorExecutionStore} from "@/state/editorExecutionStore";

const themeSelectData = [
  {title: "Default", ident: ""},
  ...thirdPartyThemes
].map(({title, ident}) => {
  return {
    label: title,
    value: ident
  }
})
export const SettingsPopover = ({children}) => {
  const {height, width, monacoOptions, setMonacoOptions, setHeight, monacoTheme, setMonacoTheme, setWidth, setSettings, graphviz, setGraphviz, executionServer, setExecutionServer, execPollWait, setExecPollWait} = useEditorSettingsStore()
  const [isLoadingTheme, setIsLoadingTheme] = useState(false)

  const [uExecServer, setUExecServer] = useState(executionServer)
  const [debouncedExecServer] = useDebouncedValue(uExecServer, 200)
  const {isLoading, pollId} = useEditorExecutionStore()
  const {monacoCtx} = useEditorStore()

  const minHeight = height <= MIN_H
  const minWidth = width <= MIN_W
  const minFontSize = monacoOptions.fontSize <= 8

  const execServerValid = useMemo(() => uExecServer.trim().length === 0 || /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/.test(uExecServer), [uExecServer])

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const isExec = useMemo(() => {
    return isLoading || !!pollId
  }, [isLoading, pollId])

  useEffect(() => {
    if (monacoCtx) {
      const editor = monacoCtx.monaco.editor
      if (monacoTheme) {
        setIsLoadingTheme(true)
        fetch(dynamicTheme(monacoTheme)).then(async resp => {
          setIsLoadingTheme(false)
          const data = await resp.json()
          editor.defineTheme(monacoTheme, data)
          editor.setTheme(monacoTheme)
        }).catch(e => {
          console.log(e)
          setIsLoadingTheme(false)
        })
      } else {
        // todo: vs-dark
        editor.setTheme(computedColorScheme === "light" ? "vs" : "vs-dark")
        // monacoCtx.editor.setTheme("vs-dark")
      }
    }
  }, [monacoTheme, monacoCtx, computedColorScheme])

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
      monacoOptions, monacoTheme
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
    <Popover width={600} trapFocus position="bottom" withArrow shadow="md">
      <Popover.Target>
        {children}
      </Popover.Target>
      <Popover.Dropdown>
        <Stack>
          <Group style={{alignItems: "flex-start"}} justify={"space-between"}>
            <Stack>
              <Text fw={700}>Code Editor</Text>
              <NativeSelect
                label={"Theme"}
                data={themeSelectData}
                disabled={isLoadingTheme}
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

              <Group maw={220}>
                <TextInput
                  label={"Execution Server"}
                  description={<>
                    Define preferred execution server to execute Cyclone's code remotely. Server could be <a target={`_blank`} href={"https://github.com"}>deployed locally</a>
                  </>}
                  placeholder={"https://..."}
                  onChange={e => setUExecServer(e.currentTarget.value)}
                  value={uExecServer}
                  error={execServerValid ? "" : "Invalid url format"}
                  disabled={isExec}
                />
              </Group>

              <div>
                <Text size={"sm"}>Execution Timeout</Text>
                <Slider
                  disabled={isExec}
                  maw={220}
                  value={execPollWait}
                  onChange={setExecPollWait}
                  label={(value) => `${value} Sec`}
                  min={MIN_POLL_WAIT}
                  max={MAX_POLL_WAIT}
                />
              </div>

            </Stack>

            <Divider orientation={"vertical"} />

            <Stack>
              <Text fw={700}>Preview & Graphviz</Text>

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
                label={"Display simplified edge description"}
                checked={!graphviz.preview.showLabelLiteral}
                onChange={e => setGraphviz({
                  ...graphviz,
                  preview: {...graphviz.preview, showLabelLiteral: !e.currentTarget.checked}
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
              <Switch
                label={"Display full state / node information"}
                checked={graphviz.preview.showNodeProps}
                onChange={e => setGraphviz({
                  ...graphviz,
                  preview: {...graphviz.preview, showNodeProps: e.currentTarget.checked}
                })}
              />
              {/* <Switch */}
              {/*   label={"Display full 'where' expression"} */}
              {/*   checked={graphviz.preview.showWhereExpr} */}
              {/*   onChange={e => setGraphviz({ */}
              {/*     ...graphviz, */}
              {/*     preview: {...graphviz.preview, showWhereExpr: e.currentTarget.checked} */}
              {/*   })} */}
              {/* /> */}

              <Switch
                label={"Set padding on edge's text"}
                checked={graphviz.preview.paddingEdgeText}
                onChange={e => setGraphviz({
                  ...graphviz,
                  preview: {...graphviz.preview, paddingEdgeText: e.currentTarget.checked}
                })}
              />
            </Stack>
          </Group>

          <Divider />

          <Text c={"dimmed"} size={"sm"}>
            <b>Tip: </b> Drag the border of the editor section / execution result section to modify the width & height.
          </Text>

          <Group grow>
            <FileButton onChange={importSettings} accept=".json">
              {(props) => <Button {...props} variant={"default"} leftSection={<IconUpload size={14} />}>Import</Button>}
            </FileButton>
            <Button  variant={"default"} leftSection={<IconDownload size={14} />} onClick={exportSettings}>Export</Button>
          </Group>

        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}