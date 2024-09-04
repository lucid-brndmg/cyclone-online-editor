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

const HelpModal = ({opened, onOpened}) => {
  const editorItems = [
    {icon: IconFolder, bold: "File Browser", text: "Include all tutorial examples and save user-defined Cyclone specifications in the browser."},
    {icon: IconBook2, bold: "Reference", text: "Quick reference to Cyclone keywords, operators and built-in functions."},
    {icon: IconListTree, bold: "Outline", text: "A mini-map for Cyclone specification structure."},
    {icon: IconEye, bold: "Visualization", text: "Preview a Cyclone specification as a graph including execution results and trace."}
  ]

  const codeEditorItems = [
    {bold: "Syntax Highlighting", text: "Highlight source code using multiple themes."},
    {bold: "Syntactic Analysis", text: "Check syntax errors."},
    {bold: "Semantic Analysis", text: "Check semantics errors."},
    {bold: "Quick Documentations", text: "Display reference and help information for built-in functions and keywords."},
    {bold: "Code Completion & Snippets", text: "Auto-code completion and snippets."},
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
                The code editor can check both syntax and semantic errors for a Cyclone spec. Errors and warnings are highlighted in the editor. The full features include:
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
              {/* <Space /> */}
              {/* <Text size={"sm"}> */}
              {/*   Code editor is available when <Anchor href={PublicUrl.Tutorial}>browsing tutorial</Anchor>. To unlock the full power of the cyclone editor and get the best user experience, please visit <Anchor href={PublicUrl.Editor}>Cyclone Editor</Anchor>. */}
              {/* </Text> */}
            </Stack>
            <Stack gap={"xs"}>
              <Text fw={500}>Cyclone Editor</Text>
              <Text size={"sm"}>
                The Cyclone Editor provides the following features:
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
              {/* <Space /> */}
              {/* <Text size={"sm"}> */}
              {/*   "Run" button at the top, the code will be executed by Cyclone and the result will be displayed as text at "Execution Result" panel. If currently inside the cyclone editor, visualization representation of the result & trace will be ready at "Visualization" panel. */}
              {/* </Text> */}
            </Stack>
          </SimpleGrid>
          <Stack gap={"xs"}>
            <Text fw={500}>About</Text>
            <Text size={"sm"}>
              Cyclone is designed by <Anchor  href={"https://classicwuhao.github.io/"}>Hao Wu</Anchor>.
              This website is designed by <Anchor  href={"https://github.com/lucid-brndmg"}>Haoyang Lu</Anchor>.
            </Text>
          </Stack>
        </Stack>
        <Divider />
        <Group justify={"right"}>
          <Button variant={"default"} onClick={close}>OK</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default HelpModal