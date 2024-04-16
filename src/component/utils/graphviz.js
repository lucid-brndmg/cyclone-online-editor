/*
* Component of display graphviz DOT images
* */

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

// Graphviz wrapper for React
const Graphviz = forwardRef(({
  dot, options, animationSpeed, className,
  onHeightChange, // onZoom, // onInit,
  initHeight, // initTransform,
  maxWidth, maxHeight
}, ref) => {
  const {assignGraphvizId} = useGraphvizStore()
  const [assignedId, setAssignedId] = useState(undefined)
  const boxRef = useRef()
  // const id =  useMemo(() => assignGraphvizId(), [])

  // useEffect(() => {
  //   d3.select(`#${id}`).on("DOMContentLoaded", e => {
  //     console.log("d3 ready")
  //   })
  // }, []);

  // useEffect(() => {
  //   onInit(ref.current)
  // }, []);

  const prepAnimation = (g, animationSpeed) => {
    if (animationSpeed !== AnimationSpeed.None) {
      const getTransition = () => {
        return d3.transition().ease(d3.easeLinear).duration(AnimationDuration[animationSpeed])
      }
      return g.transition(getTransition)
    }

    return g
  }

  useEffect(() => {
    if (!assignedId) {
      const id = assignGraphvizId()
      setAssignedId(id)
      return
    }

    const id = assignedId
    const elem = d3.select(`#${id}`)
    let g = elem.graphviz({...options, width: "100%", height: "100%"})
    g = prepAnimation(g, animationSpeed)

    // if (onZoom || initTransform) {
    //   g.on("end", () => {
    //     if (initTransform) {
    //       const regex = /(?:translate\(([\-0-9\.]+)\,([\-0-9\.]+)\))\s+(?:scale\(([\-0-9\.]+)\))/
    //       const [, transX, transY, scale] = regex.exec(initTransform)
    //
    //       g.zoomSelection().call(
    //         d3.zoom().transform,
    //         d3.zoomIdentity
    //           .translate(parseInt(transX) || 0, parseInt(transY) || 0)
    //           .scale(parseInt(scale) || 1)
    //       )
    //       const e = document.querySelector(`#${id} > svg > g`)
    //       e.setAttribute("transform", initTransform)
    //     }
    //
    //     // onZoom && g.on("zoom", () => onZoom(id))
    //   })
    // }

    g
      .dot(dot)
      .render()
  }, [dot, animationSpeed, options, assignedId]); // , options, animationSpeed

  const onMouseDown = e => {
    const {height} = e.target.getBoundingClientRect()
    const initY = e.clientY
    // const elem = d3
    //   .select(`#${id}`)
    //   .selectWithoutDataPropagation("svg")

    const onMouseMove = e => {
      const incrY = e.clientY - initY
      // console.log("move height")
      // elem.attr("height", height + incrY)
      boxRef.current.style.height = `${height + incrY}px`
    }

    const onMouseUp = e => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener('selectstart', disableSelect);

      const incrY = e.clientY - initY
      const finalHeight = height + incrY
      // console.log("final height")
      // elem.attr("height", finalHeight)
      onHeightChange && onHeightChange(finalHeight)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener('selectstart', disableSelect);
  }

  return (<Box
    onMouseDown={onMouseDown}
    style={{
      border: "2px solid var(--mantine-color-orange-filled)",
      cursor: "ns-resize",
      height: initHeight ? initHeight : undefined,
      maxWidth, maxHeight
    }}
    ref={boxRef}
  >
    <div
      className={className}
      id={assignedId}
      ref={ref}
      style={{cursor: "default", width: "100%", height: "100%"}}
    />
  </Box>)
})

// Single graphviz image
export const GraphvizSinglePreview = ({code, leftSection, onHeightChange, initHeight, maxWidth, maxHeight}) => {
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
              onHeightChange={onHeightChange}
              // onInit={onInit}
              initHeight={initHeight}
              maxWidth={maxWidth}
              maxHeight={maxHeight}
            />
            <Group grow>
              <Button onClick={resetZoom} leftSection={<IconZoomIn size={16} />} >Reset Zoom</Button>
              <Button variant={"default"} onClick={downloadSvg} leftSection={<IconDownload size={16} />}>Download SVG</Button>
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

// multi graphviz images
export const GraphvizMultiPreview = ({
  codes,
  leftSection,
  // onZoom,
  onHeightChange,
  visualStates
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
            <Button onClick={resetZoom} leftSection={<IconZoomIn size={16} />}>Reset Zoom</Button>
            <Button variant={"default"} leftSection={<IconDownload size={16} />} onClick={downloadAllSvg}>Download All</Button>
          </Group>

          {codes.map(({code, title, filename}, i) => {
            const initHeight = visualStates
              ? visualStates[i]?.initHeight
              : undefined
            // const initTransform = visualStates
            //   ? visualStates[i]?.initTransform
            //   : undefined
            return (
              <Box key={i}>
                {title}
                <Graphviz
                  dot={code}
                  options={d3Options}
                  animationSpeed={graphvizOptions.animationSpeed}
                  className={classes.preview}
                  ref={el => graphvizRef.current[i] = el}
                  // onZoom={onZoom ? id => onZoom(i, id) : undefined}
                  onHeightChange={onHeightChange ? h => onHeightChange(i, h) : undefined}
                  initHeight={initHeight}
                  // initTransform={initTransform}
                  maxHeight={"60vh"}
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