import {CycloneEditorMainSection} from "@/component/editor/editorSection";
import {Flex, Stack} from "@mantine/core";
import {EditorHelperPanel} from "@/component/helper/editorHelper";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {FileStateWrapper} from "@/component/helper/browser";
import Head from "next/head";

const PlaygroundMainContent = () => {
  const {width} = useEditorSettingsStore()
  return (
    <Stack align={"flex-start"}>
      <FileStateWrapper />
      <Flex
        px={"md"}
        w={"100%"}
        direction={{ base: 'column', lg: 'row' }}
        gap={{ base: 'sm', md: 'lg' }}
        justify={{ md: 'center', lg: "space-between" }}
        // align={{base: "center", md: "flex-start"}}
      >
        <EditorHelperPanel miw={"280px"} />
        <CycloneEditorMainSection style={{flexGrow: 1}} miw={`${width}vw`} />
      </Flex>
    </Stack>
  )
}

const PlaygroundPage = () => {
  return (
    <>
      <Head>
        <title>Cyclone Playground</title>
      </Head>
      <main>
        <PlaygroundMainContent />
      </main>
    </>
  )
}

export default PlaygroundPage