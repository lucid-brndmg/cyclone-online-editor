import {Box, Divider, Paper, Stack} from "@mantine/core";
import {CycloneCodeEditor} from "@/component/editor/codeEditor";
import {useEditorStore} from "@/state/editorStore";
import {disableSelect, pxToVh, pxToVw} from "@/lib/dom";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {useDebouncedValue} from "@mantine/hooks";
import {CodeConsoleResultSection} from "@/component/editor/execution";
import {StatusBar, Toolbar} from "@/component/editor/bars";

export const CycloneEditorForm = ({
  light = false,
}) => {
  const {code, setCode, errors, setErrors, setPosition, setEditorCtx, setMonacoCtx} = useEditorStore()
  const [debouncedCode] = useDebouncedValue(code, 200)

  const {height, width, monacoOptions, setWidth, setHeight} = useEditorSettingsStore()

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

  // <CodeConsoleResultSection mode={resultMode}/>

  return (
    <Paper
      shadow="none"
      withBorder={true}
      w={"100%"}
      radius={"md"}
      p="xs"
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
      <Stack gap={"xs"} style={{position: "relative", zIndex: 120}}>
        <Toolbar light={light} />
        <Divider />
        <CycloneCodeEditor
          debouncedCode={debouncedCode}
          options={monacoOptions}
          code={code}
          onCode={setCode}
          errors={errors}
          onErrors={setErrors}
          onCursorPosition={setPosition}
          onMonacoReady={setMonacoCtx}
          onEditorContext={setEditorCtx}
          height={`${height}svh`}
        />
        <Divider />
        <StatusBar/>
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
      p={"xs"}
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

export const CycloneEditorMainSection = ({light = false, ...props}) => {
  return (
    <Stack {...props}>
      <CycloneEditorForm light={light} />
      <CycloneExecutionResultForm />
    </Stack>
  )
}