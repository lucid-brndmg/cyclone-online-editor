import {useEditorStore} from "@/state/editorStore";
import {useEditorExecutionStore} from "@/state/editorExecutionStore";
import Config from "../../../resource/config.json";
import {parseExecutionResultPaths, sanitizeResult} from "@/core/result";
import {useEffect, useMemo, useRef, useState} from "react";
import {IconArrowsMaximize, IconCopy, IconTerminal2} from "@tabler/icons-react";
import {
  Button,
  Code,
  CopyButton,
  Divider,
  Group,
  LoadingOverlay,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TypographyStylesProvider
} from "@mantine/core";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";

export const CodeExecutionButton = ({...props}) => {
  const {code, setCode, editorCtx} = useEditorStore()
  const {setIsLoading, setIsError, setStateTransCopy, setExecutionResult, isLoading, executionResult, setParsedPaths} = useEditorExecutionStore()
  const invalidCode = useMemo(() => code.trim().length === 0, [code])
  const {executionServer} = useEditorSettingsStore()

  const runCode = async () => {
    if (invalidCode || !editorCtx) {
      return
    }
    setIsLoading(true)
    setIsError(false)
    setStateTransCopy({
      states: editorCtx.getDefinedStates(),
      trans: editorCtx.getDefinedTransitions()
    })
    const resp = await fetch(`${executionServer.trim() || Config.executionServer.url}/run`, {
      method: "POST",
      body: JSON.stringify({program: code}),
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin':'*',
        'Content-Type' : 'application/json; charset=UTF-8'
      }
    })
      .then(r => r.json())
      .catch(e => {
        console.log(e)
        setIsLoading(false)
        setIsError(true)
      })

    setIsLoading(false)
    if (resp && resp.hasOwnProperty("success")) {
      setExecutionResult(resp)
    } else {
      setIsError(true)
    }
  }

  useEffect(() => {
    if (executionResult?.result) {
      const paths = parseExecutionResultPaths(executionResult.result)
      if (paths.states.size || paths.edges.length) {
        setParsedPaths(paths)
      } else {
        setParsedPaths(null)
      }
    } else {
      setParsedPaths(null)
    }
  }, [executionResult])

  return (
    <Button
      onClick={runCode}
      disabled={invalidCode}
      loading={isLoading}
      {...props}
    >
      Run
    </Button>
  )
}

export const CodeConsoleResultSection = () => {
  // const placeholder = `Code execution result will be presented here ...`
  const [resultMode, setResultMode] = useState("Result")
  const { executionResult, isError, isLoading } = useEditorExecutionStore()
  const {resultHeight, executionServer} = useEditorSettingsStore()
  const {setErrors} = useEditorStore()
  const viewport = useRef(null)
  const [examineOpened, setExamineOpened] = useState(false)

  const sanitized = useMemo(() => {
    if (executionResult) {
      return sanitizeResult(executionResult.result)
    } else {
      return {errors: [], sanitized: null}
    }
  }, [executionResult])

  useEffect(() => {
    setErrors(sanitized.errors)
    viewport.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [sanitized])

  useEffect(() => {
    if (!executionResult?.trace && resultMode === "Trace") {
      setResultMode("Result")
    }
  }, [executionResult]);

  return (
    <Stack gap={12} pos={"relative"}>
      <ExamineModal opened={examineOpened} onOpened={setExamineOpened} />
      <LoadingOverlay visible={isLoading} />
      <Group justify={"space-between"}>
        <Group>
          <IconTerminal2 />
          <Text fw={500}>Execution Result</Text>
          {executionResult?.trace ? <SegmentedControl color={"blue"} size={"xs"} data={["Result", "Trace"]} value={resultMode} onChange={setResultMode} /> : null}
        </Group>
        <Group>
          {
            executionResult?.success
              ? <>
                <CopyButton value={resultMode === "Result" ? executionResult.result : executionResult.trace}>
                  {({ copied, copy }) => (
                    <Button variant={"subtle"} size={"compact-sm"} color={"gray"} leftSection={<IconCopy size={16} />} onClick={copy}>
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </CopyButton>
                <Button onClick={() => setExamineOpened(true)} leftSection={<IconArrowsMaximize />} size={"compact-sm"} variant={"subtle"} color={"gray"}>
                  Examine
                </Button>
              </>
              : null
          }
        </Group>
      </Group>

      <Divider />

      {
        executionResult?.success === false
          ? <Text c={"red"} size={"sm"} fw={500}>
            Error occurred when executing code on remote server. Please try again later
          </Text>
          : executionResult
            ? <ScrollArea.Autosize viewportRef={viewport} mah={`${resultHeight - 9}svh`} p={0} type="auto" mt={"sm"}>
              {resultMode === "Result"
                ? <TypographyStylesProvider fz={"sm"} p={0}>
                  <div dangerouslySetInnerHTML={{__html: sanitized.sanitized}} />
                </TypographyStylesProvider>
                : <Code block={true}>{executionResult.trace}</Code>
              }
            </ScrollArea.Autosize>
            : isError
              ? <Text c={"red"} size={"sm"} fw={500}>
                Error connecting server. Please check network connection. {executionServer ? `Execution Server: ${executionServer}` : ""}
              </Text>
              : <Text c={"dimmed"} size={"sm"}>
                Press 'run' to execute the code and see execution code.
              </Text>
      }

    </Stack>
  )
}

export const ExamineModal = ({opened, onOpened}) => {
  const { executionResult, isError } = useEditorExecutionStore()
  const [resultMode, setResultMode] = useState("Result")
  const viewport = useRef(null)

  useEffect(() => {
    viewport.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [opened])

  return (
    <Modal size={"lg"} opened={opened} onClose={() => onOpened(false)} title="Execution Result" centered>
      {executionResult?.success
        ? <Stack>
          <Divider />
          {executionResult?.trace ? <SegmentedControl data={["Result", "Trace"]} value={resultMode} onChange={setResultMode} /> : null}
          <ScrollArea.Autosize viewportRef={viewport} mah={`50svh`} p={0} type="auto" mt={"sm"}>
            {resultMode === "Result"
              ? <pre>{executionResult.result}</pre>
              : <pre>{executionResult.trace}</pre>
            }
          </ScrollArea.Autosize>
          <Divider />
          <Group justify={"right"}>
            <CopyButton value={resultMode === "Result" ? executionResult.result : executionResult.trace}>
              {({ copied, copy }) => (
                <Button variant={"default"} color={"gray"} leftSection={<IconCopy size={16} />} onClick={copy}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Stack>
        : <Text size={"sm"}>Nothing to display</Text>
      }
    </Modal>
  )
}