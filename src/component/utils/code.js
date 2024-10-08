import {Box, Button, Code, CopyButton, Group, Tooltip} from "@mantine/core";
import {IconCopy, IconDownload, IconPlayerPlayFilled} from "@tabler/icons-react";
import {useMemo} from "react";
import hljs from "highlight.js";
import {CycloneLanguageId} from "@/core/monaco/language";
import hljsCyclone from "@/core/utils/highlight";
import {downloadTextFile} from "@/lib/dom";
import {isCycloneExecutableCode} from "@/core/utils/language";
import {PublicUrl} from "@/core/utils/resource";

// Code highlight for Cyclone
export const HighlightedCycloneCode = ({code, ...props}) => {
  // const [hlResult, setHlResult] = useState("")

  const hlResult = useMemo(() => {
    if (!hljs.listLanguages().includes(CycloneLanguageId)) {
      hljs.registerLanguage(CycloneLanguageId, hljsCyclone)
    }
    return hljs.highlight(
      code,
      { language: CycloneLanguageId }
    ).value
  }, [code])

  // useEffect(() => {
  //   if (!hljs.listLanguages().includes(CycloneLanguageId)) {
  //     hljs.registerLanguage(CycloneLanguageId, hljsCyclone)
  //   }
  //   const highlightedCode = hljs.highlight(
  //     code,
  //     { language: CycloneLanguageId }
  //   ).value
  //   setHlResult(highlightedCode)
  // }, [])

  return (
    <pre
      style={{whiteSpace: "pre-wrap"}}
      dangerouslySetInnerHTML={{__html: hlResult}}
      {...props}
    />
  )
}

// Code block that supports copy and load to editor
export const ExecutableCycloneCode = ({code, onTry, tip, ...props}) => {

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
        <Tooltip label={tip ?? "Click 'run' to see results"}>
          <Button size={"compact-sm"} rightSection={<IconPlayerPlayFilled size={14} />} onClick={onTry}>Try</Button>
        </Tooltip>
      </Group>
      <HighlightedCycloneCode code={code} {...props} />
    </Box>
  )
}

// Code block that supports copy and download
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

// Extract text from element
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

// Replacer for HTML elements
// Replace raw Cyclone code blocks to Highlight.js blocks
// Replace URLs to match prefix
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