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
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {GraphvizMultiPreview, GraphvizSinglePreview} from "@/component/utils/graphviz";
import {useEditorExecutionStore} from "@/state/editorExecutionStore";
import {graphviz} from "d3-graphviz";
import cycloneAnalyzer from "cyclone-analyzer"; // KEEP THIS LINE

const {
  edgeLengths
} = cycloneAnalyzer.utils.edge

const PreviewPanel = () => {
  const {editorCtx} = useEditorStore()
  const {graphviz} = useEditorSettingsStore()
  const [visualData, setVisualData] = useState(null)
  const [definedStatesGraphviz, tip] = useMemo(() => {
    if (visualData?.states.size || visualData?.trans.length) {
      const el = edgeLengths(visualData.trans, [...visualData.states.keys()])
      return [genGraphvizPreview(visualData, graphviz), <Text c={"dimmed"} maw={"70%"} size={"sm"}><b>Got {visualData.states.size} states with {el} edges.</b> Try execute the code by click "run" to see the final result.</Text>]
    } else {
      return ["", <Text size={"sm"} c={"dimmed"}>Got no defined states. Define some in code to see result.</Text>]
    }
  }, [visualData, graphviz])

  useEffect(() => {
    if (editorCtx) {
      setVisualData(editorCtx.getVisualData())
    } else {
      setVisualData(null)
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
  const {visualDataCopy, parsedPaths, executionResult, isError, isLoading} = useEditorExecutionStore()
  const {graphviz} = useEditorSettingsStore()
  const [blendIn, setBlendIn] = useState(false)
  const [incPath, setIncPath] = useState([])
  const [selectedPath, setSelectedPath] = useState([])

  const codes = useMemo(() => {
    if (!parsedPaths) {
      return []
    }
    const graphs = blendIn
      ? parsedPaths.edges.map(edge => {
        return genGraphvizPreview(visualDataCopy, graphviz, {states: new Set(edge), edge})
      })
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
      disabled={!visualDataCopy}
      onChange={e => setBlendIn(e.currentTarget.checked)}
    />
  )

  const noPathMessage = useMemo(() => {
    if (codes.length) {
      return null
    }
    if (isError) {
      return "Execution error. Please see the execution panel for details"
    }
    if (executionResult) {
      return "Code executed, no path found."
    }
    if (isLoading) {
      return "Code executing, please wait..."
    }
    return "Press \"Run\" button to preview the paths found by Cyclone."
  }, [codes, executionResult, isError])

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
        : <Text c={"dimmed"} size={"sm"}>{noPathMessage}</Text>
      }
    </Stack>
  )
}

const TracePanel = () => {
  const {executionResult, traceIsGraphviz, parsedTraces, compilerOptions, isLoading} = useEditorExecutionStore()
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
    if (traceIsGraphviz) {
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
    } else if (parsedTraces) {
      const codes = genGraphvizTrace(parsedTraces, graphviz)
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

    return null
  }, [executionResult, graphviz, parsedTraces, traceIsGraphviz])

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
    if (traceCtx?.isRemote) {
      return traceCtx?.traces
    }

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
              Not all traces are shown on the screen and some of the preview options are currently not available.
              <br/>
              To view traces in a different view, try set <code>option-output="trace";</code> at the beginning of the code.
            </Text> : <Text size={"sm"} maw={"70%"} c={"dimmed"}>
              Here are the traces of variable mutation in node / state.
            </Text>}
          />
        </>
        : executionResult
          ? <Text c={"dimmed"} size={"sm"}>
            { compilerOptions?.get("trace") === "true"
              ?
              "Execution finished. No trace information was generated by the solver."
              : <>
                Trace feature is not enabled. Try to add <code>option-trace=true;</code> at the beginning of the code to enable the trace feature.
              </>
            }
          </Text>
          : isLoading
            ? <Text c={"dimmed"} size={"sm"}>Code executing, please wait ...</Text>
            :<Text c={"dimmed"} size={"sm"}><b>Tip:</b> Add <code>option-trace=true;</code> at the beginning of the code to enable trace mode and execute the code by clicking 'run' to view traces.</Text>
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
  const edgeLength = parsedPaths?.total
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
                <Badge style={{display: edgeLength ? "" : "none"}} size="sm" variant="filled" color="red" p={4} h={16}>
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