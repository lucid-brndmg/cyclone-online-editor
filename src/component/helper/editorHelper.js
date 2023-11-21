import {Badge, Box, Divider, Indicator, Paper, rem, ScrollArea, Space, Tabs} from "@mantine/core";
import {
  IconAnalyzeFilled,
  IconArrowRightCircle,
  IconBook2,
  IconChartCircles, IconEye,
  IconFolder,
  IconListTree
} from "@tabler/icons-react";
import {OutlinePanel} from "@/component/helper/outline";
import {useEditorStore} from "@/state/editorStore";
import {ReferencePanel} from "@/component/helper/reference";
import {BrowserPanel} from "@/component/helper/browser";
import {useEditorHelperStore} from "@/state/editorHelperStore";
import {VisualizationPanel} from "@/component/helper/visualization";
import {useEditorExecutionStore} from "@/state/editorExecutionStore";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";

const EditorTabWrap = ({children}) => {
  const {height, resultHeight} = useEditorSettingsStore()
  const editorHeight = height + resultHeight
  return (
    <>
      <Divider mb={"md"} mt={"xs"} />
      <ScrollArea.Autosize mah={`${editorHeight <= 77 ? 77 : (editorHeight + 7)}svh`} type="auto">
        <Box pr={"16px"}>
          {children}
        </Box>
        <Space />
        <Space />
      </ScrollArea.Autosize>
    </>
  )
}

export const EditorHelperPanel = ({...props}) => {
  // const iconStyle = { width: rem(12), height: rem(12) };
  const {errors} = useEditorStore()
  const {executionResult, parsedPaths} = useEditorExecutionStore()
  const {helperTab, setHelperTab} = useEditorHelperStore()

  return (
    <Paper shadow="none" withBorder={false} w={"100%"} radius={"md"} p="xs" {...props}>
      <Tabs variant="pills" value={helperTab} onChange={setHelperTab}>
        <Tabs.List grow>
          <Tabs.Tab  value="browser" leftSection={<IconFolder />}>
            Browser
          </Tabs.Tab>
          <Tabs.Tab  value="reference" leftSection={<IconBook2 />}>
            Reference
          </Tabs.Tab>
          <Tabs.Tab
            value="outline"
            leftSection={<IconListTree />}
            rightSection={<Indicator disabled={!errors.length} ml={4} processing color={"red"} />}
          >
            Outline
          </Tabs.Tab>
          <Tabs.Tab
            value="visual"
            leftSection={<IconEye />}
            rightSection={<Indicator disabled={!executionResult?.trace && !parsedPaths?.edges.length} ml={4} color={"red"} />}
          >
            Visualization
          </Tabs.Tab>
        </Tabs.List>

        {helperTab === "browser" ? <Tabs.Panel value="browser">
          <EditorTabWrap>
            <BrowserPanel />
          </EditorTabWrap>
        </Tabs.Panel> : null}
        {helperTab === "reference" ? <Tabs.Panel value="reference">
          <EditorTabWrap>
            <ReferencePanel />
          </EditorTabWrap>
        </Tabs.Panel> : null}
        {helperTab === "outline" ? <Tabs.Panel value="outline">
          <EditorTabWrap>
            <OutlinePanel />
          </EditorTabWrap>
        </Tabs.Panel> : null}
        {helperTab === "visual" ? <Tabs.Panel value="visual">
          <EditorTabWrap>
            <VisualizationPanel />
          </EditorTabWrap>
        </Tabs.Panel> : null}
      </Tabs>
    </Paper>
  )
}