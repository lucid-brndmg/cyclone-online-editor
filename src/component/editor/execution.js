import {useEditorStore} from "@/state/editorStore";
import {useEditorExecutionStore} from "@/state/editorExecutionStore";
import Config from "../../../resource/config.json";
import {
  isNoCounterExampleFound,
  parseExecutionResultPaths, parseTrace,
  ResponseCode,
  sanitizeResult,
  translateErrorResponse
} from "@/core/execution";
import {useEffect, useMemo, useRef, useState} from "react";
import {IconArrowsMaximize, IconCopy, IconTerminal2, IconX} from "@tabler/icons-react";
import {
  Box,
  Button,
  Code,
  CopyButton,
  Divider,
  Group, Loader,
  LoadingOverlay,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TypographyStylesProvider
} from "@mantine/core";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {isGraphviz} from "@/core/utils/language";
import {useHotkeys} from "@mantine/hooks";

export const CodeExecutionButton = ({...props}) => {
  const {code, editorCtx} = useEditorStore()
  const {
    setIsLoading,
    setIsError,
    setVisualDataCopy,
    setExecutionResult,
    setParsedPaths,
    setErrorMessage,
    setIsPolling,
    setParsedTraces,
    setTraceIsGraphviz,
    isLoading, executionResult, isPolling,
  } = useEditorExecutionStore()
  const isPollingRef = useRef(isPolling)
  const invalidCode = useMemo(() => code.trim().length === 0, [code])
  const {executionServer, execPollWait} = useEditorSettingsStore()

  useEffect(() => {
    isPollingRef.current = isPolling
  }, [isPolling]);

  const execServerAddr = process.env.NEXT_PUBLIC_CYCLONE_EXEC_SERVER
    ?? Config.executionServer.url

  const preparePoll = (id) => {
    const begin = Date.now()
    setIsPolling(true)
    setIsLoading(true)
    isPollingRef.current = true
    const handle = setInterval(async () => {
      if (!isPollingRef.current) {
        clearInterval(handle)
        setIsLoading(false)
        setIsError(true)
        setErrorMessage("Execution canceled")
        return
      }

      if (Date.now() - begin > execPollWait * 1000) {
        clearInterval(handle)
        setIsError(true)
        setErrorMessage("Execution timeout: No response from server. Please retry later")
        setIsPolling(false)
        return
      }
      try {
        const resp = await fetch(`${executionServer.trim() || execServerAddr}/get?id=${id}`, {
          mode: "cors"
        }).then(it => it.json())
        switch (resp?.code) {
          case ResponseCode.Success: {
            setIsLoading(false)
            setExecutionResult(resp.data)
            break
          }
          case ResponseCode.NotFound: break;
          default: {
            console.log(resp)
            throw new Error("unknown response code")
          }
        }
      } catch (e) {
        console.log(e)
        setIsLoading(false)
        setIsError(true)
        setErrorMessage("Network error: failed to send request to remote server")
        clearInterval(handle)
        setIsPolling(false)
      }
    }, Config.executionServer.pollInterval)
  }

  const runCode = async () => {
    if (invalidCode || !editorCtx) {
      return
    }
    setIsLoading(true)
    setExecutionResult(null)
    setIsError(false)
    setErrorMessage("")
    setVisualDataCopy(editorCtx.getVisualData())
    setTraceIsGraphviz(false)

    try {
      const resp = await fetch(`${executionServer.trim() || execServerAddr}/exec`, {
        method: "POST",
        body: JSON.stringify({program: code}),
        mode: 'cors',
        headers: {
          'Access-Control-Allow-Origin':'*',
          'Content-Type' : 'application/json; charset=UTF-8'
        }
      }).then(r => r.json())

      setIsLoading(false)
      if (resp && resp.code === ResponseCode.Success) {
        setExecutionResult(resp.data)
      } else if (resp && resp.code === ResponseCode.Enqueued) {
        preparePoll(resp.data)
      } else {
        setIsError(true)
        setErrorMessage(translateErrorResponse(resp?.code, resp?.data))
      }
    } catch (e) {
      console.log(e)
      setIsLoading(false)
      setIsError(true)
      setErrorMessage("Network error: failed to send request to remote server")
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

      if (executionResult.trace) {
        const graphviz = isGraphviz(executionResult.trace)
        setTraceIsGraphviz(graphviz)
        if (graphviz) {
          setParsedTraces(null)
        } else {
          setParsedTraces(parseTrace(executionResult.trace))
        }
      } else {
        setParsedTraces(null)
        setTraceIsGraphviz(false)
      }
    } else {
      setParsedPaths(null)
      setParsedTraces(null)
      setTraceIsGraphviz(false)
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

const NothingFoundText = ({result}) => isNoCounterExampleFound(result)
  ? <Text span c={"#74B816"} fw={700}>No Counter-example found.</Text>
  : <Text span c={"#fa5252"} fw={700}>No path found.</Text>

export const CodeConsoleResultSection = () => {
  // const placeholder = `Code execution result will be presented here ...`
  const [resultMode, setResultMode] = useState("Result")
  const {
    executionResult,
    isError, isLoading , errorMessage,
    isPolling, setIsPolling,
    parsedPaths, parsedTraces, traceIsGraphviz,

    setIsError,
    setVisualDataCopy,
    setExecutionResult,
    setParsedPaths,
    setErrorMessage,
    setParsedTraces,
    setTraceIsGraphviz,

  } = useEditorExecutionStore()
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

  const cancelPoll = () => {
    setIsPolling(false)
  }

  const onClear = () => {
    setIsError(false)
    setExecutionResult(null)
    setVisualDataCopy(null)
    setIsError(false)
    setParsedPaths(null)
    setParsedTraces(null)
    setTraceIsGraphviz(false)
    setErrorMessage("")
  }

  return (
    <Stack gap={4} pos={"relative"} h={"100%"}>
      <ExamineModal opened={examineOpened} onOpened={setExamineOpened} />
      <LoadingOverlay
        visible={isLoading}
        loaderProps={isPolling ? {
          children: (
            <Stack style={{alignItems: "center"}}>
              <Loader color="blue" />
              <Button variant={"default"} onClick={cancelPoll}>Cancel</Button>
            </Stack>
          )
        } : undefined}
      />
      <Group justify={"space-between"}>
        <Group>
          <IconTerminal2 />
          <Text fw={500}>Execution Result</Text>
          {executionResult?.trace ? <SegmentedControl color={"blue"} size={"xs"} data={["Result", "Trace"]} value={resultMode} onChange={setResultMode} /> : null}
        </Group>
        <Group>
          {
            executionResult// ?.success
              ? <>
                <CopyButton value={resultMode === "Result" ? executionResult.result : executionResult.trace}>
                  {({ copied, copy }) => (
                    <Button variant={"subtle"} size={"compact-sm"} color={"gray"} leftSection={<IconCopy size={16} />} onClick={copy}>
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </CopyButton>
                <Button onClick={() => setExamineOpened(true)} leftSection={<IconArrowsMaximize size={16} />} size={"compact-sm"} variant={"subtle"} color={"gray"}>
                  Examine
                </Button>
                <Button onClick={onClear} leftSection={<IconX size={16} />} size={"compact-sm"} variant={"subtle"} color={"gray"}>
                  Clear
                </Button>
              </>
              : null
          }
        </Group>
      </Group>

      <Divider />

      {
        executionResult
          ? <Box>
            {resultMode === "Result"
              // Result panel
              ? parsedPaths
                ? parsedPaths.total > 0
                  ? <Text fw={500} size={"sm"}>
                    Found {parsedPaths.total} paths
                    {parsedPaths.lengths.length
                      ? ", with lengths of: " + parsedPaths.lengths.join(", ")
                      : ""
                    }
                  </Text>
                  : <Text fw={500} size={"sm"}>Checking completed: <NothingFoundText result={executionResult.result} /></Text>
                : <Text fw={500} size={"sm"}>Checking completed: <NothingFoundText result={executionResult.result} /></Text>

              // Trace panel
              : parsedTraces
                ? parsedTraces.length
                  ? <Text fw={500} size={"sm"}>Generated {parsedTraces.length} traces</Text>
                  : <Text fw={500} size={"sm"}>No trace generated</Text>
                : traceIsGraphviz
                  ? <Text fw={500} size={"sm"}>Trace generated in Graphviz format</Text>
                  : <Text fw={500} size={"sm"}>No trace generated</Text>
            }

            <ScrollArea.Autosize viewportRef={viewport} mah={`${resultHeight - 12}svh`} p={0} type="auto" mt={"sm"}>
              {resultMode === "Result"
                ? <TypographyStylesProvider fz={"sm"} p={0}>
                  <div dangerouslySetInnerHTML={{__html: sanitized.sanitized}} />
                </TypographyStylesProvider>
                : <Code block={true}>{executionResult.trace}</Code>
              }
            </ScrollArea.Autosize>
          </Box>
          : isError
            ? <Text c={"red"} size={"sm"} fw={500}>
              {errorMessage}
            </Text>
            : <Text c={"dimmed"} size={"sm"}>
              Press 'run' to execute the code and see checking results.
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
      {executionResult// ?.success
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