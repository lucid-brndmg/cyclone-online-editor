import {CycloneEditorMainSection} from "@/component/editor/editorSection";
import {Flex, Stack} from "@mantine/core";
import {EditorHelperPanel} from "@/component/helper/editorHelper";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {FileStateWrapper} from "@/component/helper/browser";
import Head from "next/head";
import {useEditorHelperStore} from "@/state/editorHelperStore";

const PlaygroundMainContent = () => {
  const {width} = useEditorSettingsStore()
  const {setHelperTab} = useEditorHelperStore()
  const commands = {
    onTransLens: () => {
      setHelperTab("visual")
    },
    onStateLens: () => {
      setHelperTab("visual")
    }
  }
  return (
    <Stack align={"flex-start"}>
      <FileStateWrapper />
      <Flex
        px={"md"}
        w={"100%"}
        direction={{ base: 'column', lg: 'row' }}
        gap={4}
        justify={{ md: 'center', lg: "space-between" }}
        // align={{base: "center", md: "flex-start"}}
      >
        <EditorHelperPanel miw={"280px"} />
        <CycloneEditorMainSection style={{flexGrow: 1}} miw={`${width}vw`} commands={commands} />
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