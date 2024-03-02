import {createRef, forwardRef, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {Box, Button, Code, CopyButton, Group, ScrollArea, SegmentedControl} from "@mantine/core";
import classes from "@/styles/modules/GraphvizPreview.module.css";
import {IconCopy, IconDownload, IconZoomIn} from "@tabler/icons-react";
import {disableSelect, downloadBlobFile, downloadTextFile, serializeSvg} from "@/lib/dom";
import * as d3 from "d3";
import {useGraphvizStore} from "@/state/editorGraphvizStore";
import {AnimationDuration, AnimationSpeed} from "@/core/graphviz";
import JSZip from "jszip";
import {CopyableCode} from "@/component/utils/code";

const Graphviz = forwardRef(({dot, options, animationSpeed, className}, ref) => {
  const {assignGraphvizId} = useGraphvizStore()
  const id =  useMemo(() => assignGraphvizId(), [])

  useEffect(() => {
    let g = d3
      .select(`#${id}`)
      .graphviz(options)

    if (animationSpeed !== AnimationSpeed.None) {
      const getTransition = () => {
        return d3.transition().ease(d3.easeLinear).duration(AnimationDuration[animationSpeed])
      }
      g = g.transition(getTransition)
    }
    g
      .dot(dot)
      .render()
  }, [dot, animationSpeed, options]); // , options, animationSpeed

  const onMouseDown = e => {
    const {height} = e.target.getBoundingClientRect()
    const initY = e.clientY
    const elem = d3
      .select(`#${id}`)
      .selectWithoutDataPropagation("svg")

    const onMouseMove = e => {
      const incrY = e.clientY - initY
      elem.attr("height", height + incrY)
    }

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener('selectstart', disableSelect);
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener('selectstart', disableSelect);
  }

  return (<Box onMouseDown={onMouseDown} style={{
    border: "2px solid var(--mantine-color-orange-filled)",
    cursor: "ns-resize"
  }}>
    <div className={className} id={id} ref={ref} style={{cursor: "default"}} />
  </Box>)
})

export const GraphvizSinglePreview = ({code, leftSection}) => {
  const [tab, setTab] = useState("Preview")
  const {graphviz: graphvizOptions} = useEditorSettingsStore()

  const graphvizRef = useRef(null)

  const resetZoom = useCallback(() => {
    if (graphvizRef.current) {
      const { id } = graphvizRef.current;
      d3.select(`#${id}`).graphviz().resetZoom()
    }
  }, [graphvizRef])

  const downloadSvg = useCallback(() => {
    if (graphvizRef.current) {
      const svg = graphvizRef.current.innerHTML
      if (!svg) {
        return
      }

      downloadTextFile(serializeSvg(svg), "graph.svg")
    }
  }, [graphvizRef])

  const d3Options = useMemo(() => ({
    fit: true,
    zoom: true,
    engine: graphvizOptions.engine,
    tweenPaths: !graphvizOptions.performanceMode,
    tweenShapes: !graphvizOptions.performanceMode,
    convertEqualSidedPolygons: !graphvizOptions.performanceMode,
  }), [graphvizOptions])

  return (
    <>
      <Group justify={"space-between"}>
        {leftSection}
        <SegmentedControl radius={"xl"} data={["Preview", "Source"]} value={tab} onChange={setTab} />
      </Group>
      {
        tab === "Preview"
          ? <>
            <Graphviz
              dot={code}
              options={d3Options}
              animationSpeed={graphvizOptions.animationSpeed}
              className={classes.preview}
              ref={graphvizRef}
            />
            <Group grow>
              <Button onClick={resetZoom} leftSection={<IconZoomIn size={16} />} variant={"default"}>Reset Zoom</Button>
              <Button onClick={downloadSvg} leftSection={<IconDownload size={16} />}>Download SVG</Button>
            </Group>

          </>
          : <>
            <Code style={{whiteSpace: "pre-wrap"}} block={true}>{code}</Code>
            <Group grow>
              <Button variant={"default"} leftSection={<IconDownload size={16} />} onClick={() => downloadTextFile(code, "graph.dot")}>Download</Button>
              <CopyButton value={code}>
                {({ copied, copy }) => (
                  <Button leftSection={<IconCopy size={16} />} onClick={copy}>
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </CopyButton>
            </Group>
          </>
      }
    </>
  )
}

export const GraphvizMultiPreview = ({
  codes,
  leftSection
}) => {
  const [tab, setTab] = useState("Preview")
  const {graphviz: graphvizOptions} = useEditorSettingsStore()
  const graphvizRef = useRef(codes.map(() => createRef()))
  const d3Options = useMemo(() => ({
    fit: true,
    zoom: true,
    engine: graphvizOptions.engine,
    tweenPaths: !graphvizOptions.performanceMode,
    tweenShapes: !graphvizOptions.performanceMode,
    convertEqualSidedPolygons: !graphvizOptions.performanceMode,
  }), [graphvizOptions])

  const downloadAllCode = useCallback(async () => {
    if (!codes.length) {
      return
    }
    let cnt = 0
    const zip = new JSZip()
    for (let {code, filename} of codes) {
      zip.file(`${filename || `graph-${cnt}`}.dot`, code)
      cnt ++
    }

    const final = await zip.generateAsync({type: "blob"})
    await downloadBlobFile(final, "graphs.zip")
  }, [graphvizRef, codes])

  const downloadAllSvg = useCallback(async () => {
    if (!graphvizRef.current) {return}
    const svgGraphs = graphvizRef
      .current
      .map(ref => serializeSvg(ref.innerHTML))
    if (svgGraphs.length) {
      const zip = new JSZip()
      svgGraphs.forEach((svg, i) => {
        zip.file(`${codes[i].filename || `graph-${i}`}.svg`, svg)
      })
      const final = await zip.generateAsync({type: "blob"})
      await downloadBlobFile(final, "graphs.zip")
    }
  }, [graphvizRef, codes])


  const resetZoom = useCallback(() => {
    if (!graphvizRef.current) {return}
    for (let ref of graphvizRef.current) {
      if (ref) {
        const { id } = ref;
        d3.select(`#${id}`).graphviz().resetZoom()
      }
    }
  }, [graphvizRef])

  return (
    <>
      <Group justify={"space-between"}>
        {leftSection}
        <SegmentedControl radius={"xl"} data={["Preview", "Source"]} value={tab} onChange={setTab} />
      </Group>

      {tab === "Preview"
        ? <>
          <Group grow>
            <Button onClick={resetZoom} leftSection={<IconZoomIn size={16} />} variant={"default"}>Reset Zoom</Button>
            <Button  leftSection={<IconDownload size={16} />} onClick={downloadAllSvg}>Download All</Button>
          </Group>

          {codes.map(({code, title, filename}, i) => {
            return (
              <Box key={i}>
                {title}
                <Graphviz
                  dot={code}
                  options={d3Options}
                  animationSpeed={graphvizOptions.animationSpeed}
                  className={classes.preview}
                  ref={el => graphvizRef.current[i] = el}
                />
              </Box>
            )
          })}
        </>
        : <>
          <Button leftSection={<IconDownload size={16} />} onClick={downloadAllCode}>Download All</Button>
          {codes.map(({code, title, filename}, i) => {
            return (
              <Box key={i}>
                {title}
                <CopyableCode wrap={true} code={code} filename={`${filename || "graph"}.dot`} />
              </Box>
            )
          })}
        </>
      }
    </>
  )
}