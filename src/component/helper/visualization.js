import {
  Badge,
  Box,
  Button,
  Center,
  Code,
  CopyButton,
  Group, Indicator, MultiSelect,
  rem,
  SegmentedControl, Space,
  Stack,
  Switch,
  Text
} from "@mantine/core";
import {
  IconArrowRightCircle,
  IconBug,
  IconChartCircles, IconCopy, IconDownload, IconEye, IconPlayerPlay,
  IconPlaystationCircle, IconTopologyRing,
  IconTopologyRing3, IconZoomIn
} from "@tabler/icons-react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useEditorStore} from "@/state/editorStore";
import {genGraphvizExecutionResultPaths, genGraphvizPreview, genGraphvizTrace} from "@/core/graphviz";
// import {Graphviz} from "@/component/utils/graphviz";
import {downloadTextFile} from "@/lib/dom";
import classes from "../../styles/modules/GraphvizPreview.module.css";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {graphviz} from "d3-graphviz";
import {GraphvizMultiPreview, GraphvizSinglePreview} from "@/component/utils/graphviz";
import {parseExecutionResultPaths, parseTrace} from "@/core/result";
import {useEditorExecutionStore} from "@/state/editorExecutionStore";
import {isGraphviz} from "@/core/utils/language";

const PreviewPanel = () => {
  const {editorCtx} = useEditorStore()
  const {graphviz} = useEditorSettingsStore()
  const [definedStateTrans, setDefinedStateTrans] = useState(null)
  const [definedStatesGraphviz, tip] = useMemo(() => {
    if (definedStateTrans?.states.size || definedStateTrans?.trans.length) {
      return [genGraphvizPreview(definedStateTrans, graphviz), <Text c={"dimmed"} maw={"70%"} size={"sm"}><b>Got {definedStateTrans.states.size} states with {definedStateTrans.trans.length} edges.</b> Try execute the code by click "run" to see the final result.</Text>]
    } else {
      return ["", <Text size={"sm"} c={"dimmed"}>Got no defined states. Define some in code to see result.</Text>]
    }
  }, [definedStateTrans, graphviz])

  useEffect(() => {
    if (editorCtx) {
      setDefinedStateTrans({
        states: editorCtx.getDefinedStates(),
        trans: editorCtx.getDefinedTransitions()
      })
    } else {
      setDefinedStateTrans(null)
    }
  }, [editorCtx]);

  return (
    <Stack>
      <Text size={"md"} fw={700}>Realtime Preview</Text>
      {/* <Text c={"dimmed"} size={"sm"}>{tip}</Text> */}
      {
        definedStatesGraphviz
          ? <>
            <GraphvizSinglePreview leftSection={tip} code={definedStatesGraphviz} />
            <Text component={"div"} c={"dimmed"} size={"sm"}>
              <b>Tips:</b>
              <ul>
                <li>Use mouse wheels to zoom up / down the graph</li>
                <li>Drag the border to expand the height</li>
                <li>Change display options in 'settings' menu</li>
                <li>Dashed arrows means that the edge is conditional (has a 'where' expression inside). </li>
                <li>Red-texted nodes means that there are certain states undefined.</li>
              </ul>
            </Text>
          </>
          : tip
      }
    </Stack>
  )
}

const ExecPanel = () => {
  const {stateTransCopy, parsedPaths} = useEditorExecutionStore()
  const {graphviz} = useEditorSettingsStore()
  const [blendIn, setBlendIn] = useState(false)
  const [incPath, setIncPath] = useState([])
  const [selectedPath, setSelectedPath] = useState([])

  const codes = useMemo(() => {
    if (!parsedPaths) {
      return []
    }
    const graphs = blendIn
      ? parsedPaths.edges.map(edge => genGraphvizPreview(stateTransCopy, graphviz, {states: parsedPaths.states, edge}))
      : genGraphvizExecutionResultPaths(parsedPaths, graphviz)
    return graphs.map((code, i) => ({
      filename: `path-${i}`,
      code,
      title: (
        <Group mb={"sm"}>
          <Text fw={500} size={"md"} c={"dimmed"}>Path {i}</Text>
          <Text size={"sm"} fw={500}>{parsedPaths.edges[i].join("->")}</Text>
        </Group>
      )
    }))
  }, [parsedPaths, graphviz, blendIn])

  useEffect(() => {
    const ps = []
    setIncPath(codes.map((_, i) => {
      const idx = i.toString()
      ps.push(idx)
      return {label: `Path ${i}`, value: idx}
    }))
    setSelectedPath(ps)
  }, [codes]);

  const filtered = useMemo(() => {
    return codes.filter((_, i) => selectedPath.includes(i.toString()))
  }, [codes, selectedPath])

  const leftSection = (
    <Switch
      label={"Blend-In Mode"}
      checked={blendIn}
      disabled={!stateTransCopy}
      onChange={e => setBlendIn(e.currentTarget.checked)}
    />
  )

  return (
    <Stack>
      <Text size={"md"} fw={700}>Code Execution Result Paths</Text>
      {codes.length
        ? <>
          <MultiSelect
            label="Displayed Paths"
            placeholder="Pick Path"
            data={incPath}
            maxDropdownHeight={200}
            value={selectedPath}
            onChange={setSelectedPath}
          />
          <GraphvizMultiPreview
            codes={filtered}
            leftSection={leftSection}
          />
        </>
        : <Text c={"dimmed"} size={"sm"}>No result preview available.</Text>
      }
    </Stack>
  )
}

const TracePanel = () => {
  const {executionResult} = useEditorExecutionStore()
  const {graphviz} = useEditorSettingsStore()
  const [incPath, setIncPath] = useState([])
  const [selectedPath, setSelectedPath] = useState([])

  // [traceCode, isRemote]
  const traceCtx = useMemo(() => {
    const trace = executionResult?.trace
    if (!trace) {
      return null
    }

    // const isGraphviz = /^digraph\s+\w*\s+\{\s*/gm
    if (isGraphviz(trace)) {
      return {
        isRemote: true,
        traces: [{
          code: trace,
          filename: "Trace",
          title: (
            <Text mb={"sm"} fw={500} size={"md"} c={"dimmed"}>Trace</Text>
          )
        }]
      }
    } else {
      const parsed = parseTrace(trace)
      const codes = genGraphvizTrace(parsed, graphviz)
      return {
        isRemote: false,
        traces: codes.map((code, i) => ({
          code,
          filename: `Trace-${i}`,
          title: (
            <Text mb={"sm"} fw={500} size={"md"} c={"dimmed"}>Trace {i}</Text>
          )
        }))
      }
    }
  }, [executionResult, graphviz])

  useEffect(() => {
    if (!traceCtx || traceCtx.isRemote) {
      setSelectedPath([])
      return
    }
    const ps = []
    setIncPath(traceCtx.traces.map((_, i) => {
      const idx = i.toString()
      ps.push(idx)
      return {label: `Trace ${i}`, value: idx}
    }))
    setSelectedPath(ps)
  }, [traceCtx]);

  const filtered = useMemo(() => {
    return traceCtx?.traces.filter((_, i) => selectedPath.includes(i.toString()))
  }, [traceCtx, selectedPath])

  return (
    <Stack>
      <Text size={"md"} fw={700}>Trace</Text>
      {traceCtx
        ? <>
          {!traceCtx.isRemote
            ? <MultiSelect
              label="Displayed Traces"
              placeholder="Pick Trace"
              data={incPath}
              maxDropdownHeight={200}
              value={selectedPath}
              onChange={setSelectedPath}
            />
            : null
          }
          <GraphvizMultiPreview
            codes={filtered}
            leftSection={traceCtx.isRemote ? <Text maw={"70%"} size={"sm"} c={"orange"}>
              The following graph was generated from remote server.
              Not all traces are shown on the screen and some of the preview options not available.
              To enable local preview options, please try not to add <code>option-output="dot";</code>
            </Text> : <Text size={"sm"} maw={"70%"} c={"dimmed"}>
              Trace of variable mutation in node / state. Enable trace by write <code>option-trace=true;</code> at the beginning of the file.
            </Text>}
          />
        </>
        : <Text c={"dimmed"} size={"sm"}>Currently no trance available for preview. Try to add <code>option-trace=true;</code> at the beginning of the code to enable trace mode and execute the code by click 'run'.</Text>
      }
    </Stack>
  )
}

const panels = {
  "preview": PreviewPanel,
  "exec": ExecPanel,
  "trace": TracePanel
}

export const VisualizationPanel = () => {
  const [panel, onPanel] = useState("preview")
  const {executionResult, parsedPaths} = useEditorExecutionStore()
  const Component = panels[panel]
  const edgeLength = parsedPaths?.edges.length
  const hasTrace = executionResult?.trace
  return (
    <Stack>
      <SegmentedControl value={panel} onChange={onPanel} data={[
        {
          value: 'preview',
          label: (
            <Center>
              <IconTopologyRing style={{ width: rem(16), height: rem(16) }} />
              <Box ml={10}>Preview</Box>
            </Center>
          ),
        },
        {
          value: 'exec',
          label: (
            <Center>
              <IconPlayerPlay style={{ width: rem(16), height: rem(16) }} />
              <Group ml={10} gap={"xs"}>
                <Box>Execution</Box>
                <Badge style={{display: edgeLength ? "" : "none"}} size="sm" variant="filled" color="red" p={4} h={16} w={16}>
                  {edgeLength}
                </Badge>
              </Group>
            </Center>
          ),
        },
        {
          value: 'trace',
          label: (
            <Center>
              <IconArrowRightCircle style={{ width: rem(16), height: rem(16) }} />
              <Group ml={10} gap={"xs"}>
                <Box>Trace</Box>
                {/* <Badge style={{display: hasTrace ? "" : "none"}} size="sm" variant="filled" color="red" p={4} h={16} w={16}> */}
                {/*   ! */}
                {/* </Badge> */}
                <Indicator disabled={!hasTrace} color={"red"} />
              </Group>
            </Center>
          ),
        },
      ]} />
      <Component />
    </Stack>
  )
}