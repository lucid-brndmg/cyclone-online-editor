import {
  Anchor,
  Box,
  Button,
  Divider,
  Group,
  List,
  Modal,
  rem,
  SimpleGrid,
  Space,
  Stack,
  Text,
  ThemeIcon
} from "@mantine/core";
import {IconBook2, IconCircleCheck, IconEye, IconFolder, IconListTree} from "@tabler/icons-react";
import {PublicUrl} from "@/core/utils/resource";

export const HelpModal = ({opened, onOpened}) => {
  const editorItems = [
    {icon: IconFolder, bold: "File Browser", text: "Store all edited cyclone source code in the browser. Also access all official examples instantly."},
    {icon: IconBook2, bold: "Reference", text: "Look up language keywords, build-in functions, operators and compile options instantly."},
    {icon: IconListTree, bold: "Outline", text: "View code structure in a tree and jump to definition in one click just like VSCode. Navigate all errors & warnings inside source code."},
    {icon: IconEye, bold: "Visualization", text: "Preview a Cyclone program as image in real-time. Graphically observe code execution result & trace."}
  ]

  const codeEditorItems = [
    {bold: "Syntax Highlighting", text: "Display highlighted source code and supports multiple themes."},
    {bold: "Syntactic Analysis", text: "Check cyclone source code by syntax. Errors will be highlighted."},
    {bold: "Semantic Analysis", text: "Check semantic errors inside source code"},
    {bold: "Quick Documentations", text: "Display type info & reference docs (for built-in functions & keywords) on hover"},
    {bold: "Code Completion & Snippets", text: "Provide auto-completions & snippets while typing."},
  ]

  const close = () => onOpened(false)
  return (
    <Modal size={"xl"} opened={opened} onClose={close} title="Help & About" centered>
      <Stack>
        <Divider />
        <Stack>
          <SimpleGrid cols={2}>
            <Stack gap={"xs"}>
              <Text fw={500}>Code Editor</Text>
              <Text size={"sm"}>
                The code editor provides the ability to check the code both by syntax and semantic. Errors and warnings will be explicitly displayed on the editor. Full features:
              </Text>
              <Space />
              <List spacing={8} size={"sm"} center icon={
                <ThemeIcon color="teal" size={24} radius="xl">
                  <IconCircleCheck style={{ width: rem(16), height: rem(16) }} />
                </ThemeIcon>
              }>
                {codeEditorItems.map(({bold, text}, i) => {
                  return (
                    <List.Item key={i}>
                      <b>{bold}: </b> {text}
                    </List.Item>
                  )
                })}
              </List>
              <Space />
              <Text size={"sm"}>
                Lite version of the code editor is available when <Anchor href={PublicUrl.Tutorial}>browsing tutorial</Anchor>. To unlock the full power of the cyclone editor and get the best user experience, please visit <Anchor href={PublicUrl.Editor}>Cyclone Editor</Anchor>.
              </Text>
            </Stack>
            <Stack gap={"xs"}>
              <Text fw={500}>Cyclone Editor</Text>
              <Text size={"sm"}>
                The Cyclone Editor unlocks the full power of editing Cyclone by providing:
              </Text>
              <Space />
              <List
                spacing="xs"
                size="sm"
                center
              >
                {editorItems.map(({icon: Icon, bold, text}, i) => {
                  return (
                    <List.Item
                      key={i}
                      icon={
                        <ThemeIcon color="blue" size={24} radius="xl">
                          <Icon style={{ width: rem(16), height: rem(16) }} />
                        </ThemeIcon>
                      }
                    >
                      <b>{bold}: </b> {text}
                    </List.Item>
                  )
                })}
              </List>
              <Space />
              <Text size={"sm"}>
                When clicking "Run" button at the top, the code will be executed by Cyclone and the result will be displayed as text at "Execution Result" panel. If currently inside the cyclone editor, visualization representation of the result & trace will be ready at "Visualization" panel.
              </Text>
            </Stack>
          </SimpleGrid>
          <Stack gap={"xs"}>
            <Text fw={500}>About</Text>
            <Text size={"sm"}>
              Cyclone is designed by <Anchor  href={"https://classicwuhao.github.io/"}>Hao Wu</Anchor>.
              This website is designed by <Anchor  href={"https://github.com/lucid-brndmg"}>Haoyang Lu</Anchor>.
            </Text>
            <Group justify={"space-between"}>
              <Anchor fz={"sm"} href={"https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html"}>Language Reference</Anchor>
              <Anchor href={"https://github.com/lucid-brndmg/cyclone-online-editor"} fz={"sm"}>
                Project Github
              </Anchor>

              <Anchor href={"https://github.com/classicwuhao/Cyclone"} fz={"sm"}>
                Cyclone Source Code
              </Anchor>

              <Anchor href={"https://github.com/lucid-brndmg/cyclone-analyzer"} fz={"sm"}>
                Cyclone Analyzer
              </Anchor>
            </Group>
          </Stack>
        </Stack>
        <Divider />
        <Group justify={"right"}>
          <Button variant={"default"} onClick={close}>Got It</Button>
        </Group>
      </Stack>
    </Modal>
  )
}