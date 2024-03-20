import {Box, Button, Code, CopyButton, Group, Tooltip, useComputedColorScheme} from "@mantine/core";
import {IconCopy, IconDownload, IconPlayerPlayFilled} from "@tabler/icons-react";
import {useEffect, useState} from "react";
import hljs from "highlight.js";
import {CycloneLanguageId} from "@/core/monaco/language";
import hljsCyclone from "@/core/utils/highlight";
import {downloadTextFile} from "@/lib/dom";
import {isCycloneExecutableCode} from "@/core/utils/language";
import {PublicUrl} from "@/core/utils/resource";

export const HighlightedCycloneCode = ({code}) => {
  const [hlResult, setHlResult] = useState("")

  useEffect(() => {
    if (!hljs.listLanguages().includes(CycloneLanguageId)) {
      hljs.registerLanguage(CycloneLanguageId, hljsCyclone)
    }
    const highlightedCode = hljs.highlight(
      code,
      { language: CycloneLanguageId }
    ).value
    setHlResult(highlightedCode)
  }, [])

  return (
    <pre style={{whiteSpace: "pre-wrap"}} dangerouslySetInnerHTML={{__html: hlResult}} />
  )
}

export const ExecutableCycloneCode = ({code, onTry}) => {

  return (
    <Box pos={"relative"}>
      <Group justify={"right"} mb={"sm"} pos={"absolute"} style={{top: 4, right: 4}}>
        <CopyButton value={code}>
          {({ copied, copy }) => (
            <Button size={"compact-sm"} variant={"default"} leftSection={<IconCopy size={14} />} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </CopyButton>
        <Tooltip label={"Click 'run' to see results"}>
          <Button size={"compact-sm"} rightSection={<IconPlayerPlayFilled size={14} />} onClick={onTry}>Try</Button>
        </Tooltip>
      </Group>
      <HighlightedCycloneCode code={code} />
    </Box>
  )
}

export const CopyableCode = ({code, wrap = false, filename, ...props}) => {
  return (
    <Box pos={"relative"} {...props}>
      <Group justify={"right"} mb={"sm"} pos={"absolute"} style={{top: 8, right: 4}}>
        <CopyButton value={code}>
          {({ copied, copy }) => (
            <Button size={"compact-sm"} variant={"default"} leftSection={<IconCopy size={14} />} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </CopyButton>
        <Button size={"compact-sm"} variant={"default"} rightSection={<IconDownload size={14} />} onClick={() => downloadTextFile(code, filename)}>Download</Button>
      </Group>
      <Code style={{whiteSpace: wrap ? "pre-wrap" : undefined}} block={true}>
        {code}
      </Code>
    </Box>
  )
}

const extractTextFromElement = domNode => {
  switch (domNode.constructor.name) {
    case "Text": {
      return domNode.data
    }

    default: {
      let s = ""
      if (domNode.children) {
        for (let child of domNode.children) {
          s += extractTextFromElement(child)
        }
      }

      return s
    }
  }
}

export const htmlCodeUrlReplacer = onTry => ({
  replace(domNode) {
    switch (domNode.tagName) {
      case "pre": {
        const codeNode = domNode?.children[0]
        const code = extractTextFromElement(domNode)
        if (codeNode?.tagName === "code" && codeNode?.attribs?.class === "language-cyclone") {
          return onTry && isCycloneExecutableCode(code)
            ? <ExecutableCycloneCode code={code} onTry={() => onTry(code)} />
            : <HighlightedCycloneCode code={code} />
        } else {
          return (<pre>{code}</pre>)
        }
      }
      case "a": {
        const url = domNode.attribs?.href
        if (!url) return
        if (url.startsWith("/editor")) {
          domNode.attribs.href = `${PublicUrl.Editor}${url.slice("/editor".length)}`
        } else if (url.startsWith("/tutorial")) {
          domNode.attribs.href = `${PublicUrl.Tutorial}${url.slice("/tutorial".length)}`
        } else if (url === "/") {
          domNode.attribs.href = PublicUrl.Home
        }
      }
    }
  },
})