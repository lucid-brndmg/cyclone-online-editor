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
import {CycloneEditorMainSection} from "@/component/editor/editorSection";
import tutorialManifest from "../../../resource/tutorial_manifest.json";
import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/router";
import Link from "next/link";
import {
  IconArrowNarrowLeft, IconArrowNarrowRight, IconBook
} from "@tabler/icons-react";
import parse from 'html-react-parser';
import {htmlCodeUrlReplacer} from "@/component/utils/code";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {tutorialTable} from "@/core/resources/tutorial";
import {useEditorStore} from "@/state/editorStore";
import {formatStateTransRelation} from "@/core/utils/format";
import localforage from "localforage";
import {PublicUrl} from "@/core/utils/resource";

const manifestSelectionData = tutorialManifest.map(t => ({label: t.title, value: t.id}))

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
    href: `${PublicUrl.TutorialBase}${current.prev === "_default" ? "" : `/${current.prev}`}`
  } : null
  const next = current.next ? {
    title: tutorialTable[current.next].title,
    href: `${PublicUrl.TutorialBase}${current.next === "_default" ? "" : `/${current.next}`}`
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
        ? PublicUrl.Tutorial
        : `${PublicUrl.Tutorial}/${selectedId}`
    }
  }, [selectedId])

  const {prev, next} = resolveManifestPrevNext(id)

  return (
    <Group justify={"space-between"} p={"sm"}>
      {
        prev
          ? <Anchor component={Link} size={"sm"} href={prev.href}>{'<'} {prev.title}</Anchor>
          : null
      }

      <Group gap={8} style={{cursor: "pointer"}} onClick={() => router.push(PublicUrl.TutorialBase)}>
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
    Tutorial not found. <Anchor href={PublicUrl.Tutorial}>Back to category</Anchor>
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
  }, [router.asPath]);

  useEffect(() => {
    localforage.getItem("tmp_code").then(c => setCode(c ?? ""))
  }, []);

  const parsed = parse(html, htmlCodeUrlReplacer(code => setCode(code)))
  const editorHeight = resultHeight + height

  const editorCommands = {
    onTransLens: (ctx, states) => {
      alert(`connected to ${states.length} nodes: ${states.join(", ")}`)
    },
    onStateLens: (ctx, stateCtx) => {
      alert(formatStateTransRelation(stateCtx, false).text)
    }
  }

  return (
    <Stack>
      <Flex
        px={"xs"}
        w={"100%"}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        justify={{ base: 'center', md: "space-between" }}
      >
        <Paper miw={"280px"} shadow="none" withBorder={false} w={"100%"} radius={"md"}>
          <Stack gap={4}>
            {
              id === "_default" || tutorialTable.hasOwnProperty(id)
                ? <>
                  <TutorialHeadBar id={id} />
                  <Divider />
                  <ScrollArea.Autosize viewportRef={viewport} mah={`${Math.max(editorHeight, 80)}svh`} type="auto" px={"sm"}>
                    <TutorialPage>
                      {parsed}
                    </TutorialPage>
                  </ScrollArea.Autosize>
                  <Divider />
                  <Space />
                  <TutorialFootBar id={id} />
                </>
                : <NotFoundPrompt />
            }
          </Stack>
        </Paper>
        <CycloneEditorMainSection light={true} style={{flexGrow: 1}} miw={`${width}vw`} commands={editorCommands} />
      </Flex>
    </Stack>
  )
}