import {
  Box,
  Button,
  CopyButton,
  Group,
  ScrollArea,
  Stack,
  Text, Title,
  Tooltip,
  TypographyStylesProvider
} from "@mantine/core";
import {useEffect, useState} from "react";
import hljs from "highlight.js";
import {IconCopy, IconPlayerPlayFilled} from "@tabler/icons-react";
import {CycloneLanguageId} from "@/core/monaco/language";
import hljsCyclone from "@/generated/hljs/cyclone";
import localforage from "localforage";
import Config from "../../../resource/config.json";
import {useRouter} from "next/router";

export const SharedCodePreview = ({shared}) => {
  const {date, title, author, code} = shared
  const router = useRouter()
  const [displayCode, setDisplayCode] = useState()
  useEffect(() => {
    hljs.registerLanguage(CycloneLanguageId, hljsCyclone)
  }, []);

  useEffect(() => {
    // hljs.highlightAll()
    const highlightedCode = hljs.highlight(
      code,
      { language: CycloneLanguageId }
    ).value
    setDisplayCode(highlightedCode)
  }, [code]);
  const onTry = async () => {
    await localforage.setItem("tmp_code", Config.home.exampleCode)
    await router.push("/playground")
  }
  return (
    <Stack>
      <Title order={1}>{title || "Cyclone Code"}</Title>
      <Box>
        {author && <Text size={"sm"} c={"dimmed"}>Author: {author}</Text>}
        <Text size={"sm"} c={"dimmed"}>Date: {new Date(date).toLocaleString()}</Text>
      </Box>
      <Group grow>
        <CopyButton value={code}>
          {({ copied, copy }) => (
            <Button variant={"default"} leftSection={<IconCopy size={14} />} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </CopyButton>
        <Button onClick={onTry} rightSection={<IconPlayerPlayFilled size={14} />}>Open In Editor</Button>
      </Group>
      <ScrollArea.Autosize h={`70svh`}>
        <TypographyStylesProvider fz={"sm"} p={0}>
          <pre style={{whiteSpace: "pre-wrap"}} dangerouslySetInnerHTML={{__html: displayCode}} />
        </TypographyStylesProvider>
      </ScrollArea.Autosize>
    </Stack>
  )
}