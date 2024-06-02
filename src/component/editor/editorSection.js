import {Box, Divider, Paper, Stack} from "@mantine/core";
import {CycloneCodeEditor} from "@/component/editor/codeEditor";
import {useEditorStore} from "@/state/editorStore";
import {disableSelect, pxToVh, pxToVw} from "@/lib/dom";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {useDebouncedValue} from "@mantine/hooks";
import {CodeConsoleResultSection} from "@/component/editor/execution";
import {StatusBar, Toolbar} from "@/component/editor/bars";
import {useEffect, useRef} from "react";
import localforage from "localforage";
import Config from "../../../resource/config.json"
import {useEditorExecutionStore} from "@/state/editorExecutionStore";

export const CycloneEditorForm = ({
  light = false,
  commands,
  onClickErrorDisplay
}) => {
  const {code, setCode, errors, setErrors, setPosition, setEditorCtx, setMonacoCtx, editorReady, setEditorReady, setIsAnalyzerError} = useEditorStore()
  const [debouncedCode] = useDebouncedValue(code, 200)

  const {height, width, monacoOptions, setWidth, setHeight, editorCodeOptions} = useEditorSettingsStore()

  const initRef = useRef(false)

  useEffect(() => {
    setTimeout(() => initRef.current = true, 200)
  }, []);

  useEffect(() => {
    if (!initRef.current) {
      return
    }
    localforage.setItem("tmp_code", debouncedCode)// .then(() => console.log("progress saved"))

  }, [debouncedCode])

  const onMouseDown = e => {
    const [initX, initY] = [e.clientX, e.clientY]

    const onMouseMove = e => {
      const [incrX, incrY] = [0 - (e.clientX - initX), e.clientY - initY]
      // setSize([pxToVw(incrX), pxToVh(incrY)])
      setWidth(width + Math.round(pxToVw(incrX)))
      setHeight(height + Math.round(pxToVh(incrY)))
    }

    const onMouseUp = e => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener('selectstart', disableSelect);
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener('selectstart', disableSelect);
  }

  // const commands = {
  //   onTransLens: () => {
  //     console.log("switch visual")
  //   }
  // }

  // <CodeConsoleResultSection mode={resultMode}/>

  return (
    <Paper
      shadow="none"
      withBorder={true}
      w={"100%"}
      radius={"md"}
      p={8}
      pos={"relative"}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          cursor: "move",
          zIndex: 100
        }}
        onMouseDown={onMouseDown}
      />
      <Stack gap={8} style={{position: "relative", zIndex: 120}}>
        <Toolbar light={light} />
        <CycloneCodeEditor
          ready={editorReady}
          onReady={setEditorReady}
          debouncedCode={debouncedCode}
          monacoOptions={monacoOptions}
          codeOptions={editorCodeOptions}
          code={code}
          onCode={setCode}
          errors={errors}
          onErrors={setErrors}
          onCursorPosition={setPosition}
          onMonacoReady={setMonacoCtx}
          onEditorContext={setEditorCtx}
          height={`${height}svh`}
          externalCommands={commands}
          buildSyntaxBlockTree={!light}
          enableCDN={Config.editor.monacoEnableCDN}
          onAnalyzerError={(e, isE) => setIsAnalyzerError(isE)}
        />
        <StatusBar onClickErrors={onClickErrorDisplay}/>
      </Stack>
    </Paper>
  )
}

export const CycloneExecutionResultForm = () => {
  const {resultHeight, setResultHeight} = useEditorSettingsStore()

  const onMouseDown = e => {
    const initY = e.clientY
    const onMouseMove = e => {
      const incrY = e.clientY - initY
      // setSize([pxToVw(incrX), pxToVh(incrY)])
      setResultHeight(resultHeight + Math.round(pxToVh(incrY)))
    }

    const onMouseUp = e => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener('selectstart', disableSelect);
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener('selectstart', disableSelect);
  }

  const {executionServer} = useEditorSettingsStore()
  const {refreshServerInfo} = useEditorExecutionStore()

  useEffect(() => {
    const execServerAddr = process.env.NEXT_PUBLIC_CYCLONE_EXEC_SERVER
      ?? Config.executionServer.url
    const trimmed = executionServer.trim()
    refreshServerInfo(trimmed || execServerAddr)
  }, [executionServer]);

  return (
    // <Paper
    //   shadow="none"
    //   withBorder={true}
    //   w={"100%"}
    //   radius={"md"}
    //   p="xs"
    //   pos={"relative"}
    //   h={`${resultHeight}vh`}
    // >
    //   <div
    //     style={{
    //       position: "absolute",
    //       top: 0,
    //       left: 0,
    //       width: "100%",
    //       height: "100%",
    //       cursor: "move",
    //       zIndex: 100
    //     }}
    //     onMouseDown={onMouseDown}
    //   />
    //   <div style={{zIndex: 120, position: "relative"}}><CodeConsoleResultSection/></div>
    // </Paper>

    <Paper
      style={{
        // border: "4px solid transparent",
        cursor: "ns-resize",
        zIndex: 100,
        position: "relative",
        height: `${resultHeight}svh`,
        width: "100%"
      }}
      p={8}
      radius={"md"}
      withBorder={true}
      shadow="none"
      onMouseDown={onMouseDown}
    >
      <Box
        shadow="none"
        style={{zIndex: 120, width: "100%", height: "100%", position: "relative", cursor: "default"}}
        onMouseDown={e => e.stopPropagation()}
      >
        <CodeConsoleResultSection/>
      </Box>
    </Paper>
  )
}

export const CycloneEditorMainSection = ({
  light = false,
  commands,
  onClickErrorDisplay,
  ...props
}) => {
  return (
    <Stack gap={12} {...props}>
      <CycloneEditorForm light={light} commands={commands} onClickErrorDisplay={onClickErrorDisplay} />
      <CycloneExecutionResultForm />
    </Stack>
  )
}