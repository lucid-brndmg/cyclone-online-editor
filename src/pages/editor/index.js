import {CycloneEditorMainSection} from "@/component/editor/editorSection";
import {Flex, Stack} from "@mantine/core";
import {EditorHelperPanel} from "@/component/helper/editorHelper";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {FileStateWrapper} from "@/component/helper/browser";
import Head from "next/head";
import {useEditorHelperStore} from "@/state/editorHelperStore";

const EditorMainContent = () => {
  const {width} = useEditorSettingsStore()
  const {setHelperTab, setOutlineTab} = useEditorHelperStore()
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
        px={"xs"}
        w={"100%"}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        justify={{ base: 'center', md: "space-between" }}
        // align={{base: "center", md: "flex-start"}}
      >
        <EditorHelperPanel miw={"280px"} />
        <CycloneEditorMainSection style={{flexGrow: 1}} miw={`${width}vw`} commands={commands} onClickErrorDisplay={() => {
          setHelperTab("outline")
          setOutlineTab("problems")
        }} light={false} />
      </Flex>
    </Stack>
  )
}

const EditorPage = () => {
  return (
    <>
      <Head>
        <title>Cyclone Editor</title>
      </Head>
      <main>
        <EditorMainContent />
      </main>
    </>
  )
}

export default EditorPage