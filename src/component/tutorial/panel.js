import {
  Divider,
  Flex,
  Group,
  Paper,
  ScrollArea,
  Stack,
  TypographyStylesProvider,
  Text,
  Anchor,
  Space, Select, Button
} from "@mantine/core";
import classes from "@/styles/modules/TutorialBody.module.css";
import {CycloneEditorForm, CycloneEditorMainSection} from "@/component/editor/editorSection";
import tutorialManifest from "../../../resource/tutorial_manifest.json";
import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import {
  IconArrowBigLeft,
  IconArrowBigLeftFilled,
  IconArrowBigRight,
  IconArrowBigRightFilled, IconArrowNarrowLeft, IconArrowNarrowRight, IconBook
} from "@tabler/icons-react";
import hljs from "highlight.js";
import hljsCyclone from "@/generated/hljs/cyclone";
import parse, {domToReact} from 'html-react-parser';
import {ExecutableCode} from "@/component/tutorial/code";
import {isCycloneExecutableCode} from "@/core/utils/language";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {CycloneLanguageId} from "@/core/monaco/language";
import {tutorialTable} from "@/core/tutorial";
import {useEditorStore} from "@/state/editorStore";

const manifestSelectionData = tutorialManifest.map(t => ({label: t.title, value: t.id}))

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

const TutorialPage = ({children}) => {
  return (
    <TypographyStylesProvider p={"sm"} className={classes.body}>
      {/* <div dangerouslySetInnerHTML={{ __html: html }} /> */}
      {children}
    </TypographyStylesProvider>
  )
}

const resolveManifestPrevNext = id => {
  const current = tutorialTable[id]
  const prev = current.prev ? {
    title: tutorialTable[current.prev].title,
    href: `/tutorial${current.prev === "_default" ? "" : `/${current.prev}`}`
  } : null
  const next = current.next ? {
    title: tutorialTable[current.next].title,
    href: `/tutorial${current.next === "_default" ? "" : `/${current.next}`}`
  } : null

  return {prev, next}
}

const TutorialHeadBar = ({id}) => {
  // const current = tutorialTable[id]
  const [selectedId, setSelectedId] = useState(id)
  const router = useRouter()
  const resolvedId = router.asPath.split("/")[2] ?? "_default"

  useEffect(() => {
    if (resolvedId !== selectedId) {
      location.href = selectedId === "_default"
        ? "/tutorial"
        : `/tutorial/${selectedId}`
    }
  }, [selectedId])

  const {prev, next} = resolveManifestPrevNext(id)

  return (
    <Group justify={"space-between"} p={"sm"}>
      {
        prev
          ? <Anchor size={"sm"} href={prev.href}>{'<'} {prev.title}</Anchor>
          : null
      }

      <Group gap={8}>
        <IconBook />
        <Text fw={500}>
          Cyclone Tutorial
        </Text>
      </Group>

      <Select
        data={manifestSelectionData}
        value={resolvedId}
        onChange={setSelectedId}
      />
    </Group>
  )
}

const TutorialFootBar = ({id}) => {

  const {prev, next} = resolveManifestPrevNext(id)

  return (
    prev || next
      ? <Group grow>
        {prev ? <Button size={"md"} leftSection={<IconArrowNarrowLeft />} component={Link} href={prev.href} variant={"default"}>Previous: {prev.title}</Button> : null}
        {next ? <Button rightSection={<IconArrowNarrowRight/>} size={"md"} component={Link} href={next.href} variant={"outline"}>Next: {next.title}</Button> : null}
      </Group>
      : null
  )
}

const NotFoundPrompt = () => (
  <Text>
    Tutorial not found. <Anchor href={"/tutorial"}>Back to category</Anchor>
  </Text>
)

export const TutorialPanel = ({html, id}) => {
  const viewport = useRef(null);
  const {width, height, resultHeight} = useEditorSettingsStore()
  const {setCode} = useEditorStore()
  const router = useRouter();

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    hljs.registerLanguage(CycloneLanguageId, hljsCyclone)
    hljs.highlightAll()
  }, [router.asPath]);

  const options = {
    replace(domNode) {
      if (domNode.tagName === "code") {
        const code = extractTextFromElement(domNode)
        if (isCycloneExecutableCode(code)) {
          return (
            <ExecutableCode execCode={code} onTry={() => setCode(code)}>
              <code className={domNode.attribs.class} >
                {domToReact(domNode.children, options)}
              </code>
            </ExecutableCode>
          )
        }
      }
    },
  }

  const parsed = parse(html, options)
  const editorHeight = resultHeight + height

  return (
    <Stack>
      <Flex
        px={"md"}
        w={"100%"}
        direction={{ base: 'column', lg: 'row' }}
        gap={{ base: 'sm', md: 'lg' }}
        justify={{ md: 'center', lg: "space-between" }}
      >
        <Paper miw={"280px"} shadow="none" withBorder={false} w={"100%"} radius={"md"}>
          <Stack gap={"4px"}>
            {
              id === "_default" || tutorialTable.hasOwnProperty(id)
                ? <>
                  <TutorialHeadBar id={id} />
                  <Divider />
                  <ScrollArea.Autosize viewportRef={viewport} mah={`${editorHeight <= 80 ? 80 : (editorHeight + 5)}svh`} type="auto" px={"sm"}>
                    <Stack>
                      <TutorialPage>
                        {parsed}
                      </TutorialPage>
                      <Divider />
                      <TutorialFootBar id={id} />
                      <Space />
                    </Stack>
                  </ScrollArea.Autosize>
                </>
                : <NotFoundPrompt />
            }
          </Stack>
        </Paper>
        <CycloneEditorMainSection light={true} style={{flexGrow: 1}} miw={`${width}vw`} />
      </Flex>
      <Space /> <Space />
    </Stack>
  )
}