import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Group, Image,
  List, Paper,
  rem,
  ScrollArea, Select, SimpleGrid, Space,
  Stack,
  Text,
  ThemeIcon,
  Title,
  TypographyStylesProvider,
} from "@mantine/core";
import {IconCheck, IconRefresh} from "@tabler/icons-react";
import classes from "../../styles/modules/HeroSection.module.css"
import Config from "../../../resource/config.json"
import {ExecutableCycloneCode} from "@/component/utils/code";
import localforage from "localforage";
import {useRouter} from "next/router";
import {dynamicCodeExample, PublicUrl} from "@/core/utils/resource";
import logo from '../../../resource/image/logo.png'
import getConfig from "next/config";
import {useEffect, useMemo, useState} from "react";
import examplesManifest from "../../../resource/code_example_manifest.json"

/*
* Hero section of home page
* Reference: https://ui.mantine.dev/category/hero/
* */

const { publicRuntimeConfig } = getConfig()

const CodeDemo = () => {
  const router = useRouter()
  const [exampleId, setExampleId] = useState()
  const [code, setCode] = useState(Config.home.initExampleCode)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!exampleId) {
      return
    }
    setIsLoading(true)
    fetch(dynamicCodeExample(exampleId)).then(async resp => {
      setCode(await resp.text())
    }).finally(() => setIsLoading(false))
  }, [exampleId]);

  const onTry = async () => {
    await localforage.setItem("tmp_code", code)
    await router.push(PublicUrl.EditorBase)
  }

  const loadRandom = () => {
    setExampleId(examplesManifest[Math.floor(Math.random() * examplesManifest.length)].id)
  }

  return (
    <Box className={classes.codeDemo}>
      <Paper>
        <Group>
          <Select
            data={examplesManifest.map(({id, title}) => ({
              label: title,
              value: id
            }))}
            style={{flexGrow: 1}}
            value={exampleId}
            onChange={setExampleId}
            placeholder={"Select an example"}
          />
          <ActionIcon
            variant={"default"}
            size={"lg"}
            loading={isLoading}
            onClick={loadRandom}
          >
            <IconRefresh size={24} />
          </ActionIcon>
        </Group>
      </Paper>
      <TypographyStylesProvider fz={"sm"} p={0}>
        <ExecutableCycloneCode className={classes.codeDemoBlock} tip={"Open in editor"} code={code} onTry={onTry} />
      </TypographyStylesProvider>
    </Box>
  )
}

const HeroSection = () => {
    return (
    <Container size="xl">
      <div className={classes.inner}>
        <div className={classes.content}>
          <Group style={{flexWrap: "nowrap"}}>
            <img src={logo.src} width={96} height={96} style={{animation: "spin 4s infinite linear"}} />
            <Title className={classes.title}>
              A <span className={classes.highlight}>graph-based</span> specification language
            </Title>
          </Group>
          <Text c="dimmed" mt="md">
            Code up your verification tasks using a simple graph notation.
          </Text>

          <List
            mt={30}
            spacing="sm"
            size="sm"
            icon={
              <ThemeIcon color={"orange"} size={20} radius="xl">
                <IconCheck style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
              </ThemeIcon>
            }
          >
            <List.Item>
              <b>Graph Oriented Spec</b> – Visualise problems and exchange ideas using graphs.
            </List.Item>
            <List.Item>
              <b>Simple Notation</b> – No need to learn complex formalisms before writing your specification.
            </List.Item>
            <List.Item>
              <b>Online Editor</b> – Use our newly designed online editor to unlock the full experience of Cyclone.
            </List.Item>
          </List>

          <Group mt={30}>
            <Button radius="xl" size="md" className={classes.control} color={"orange"} component={"a"} href={PublicUrl.Editor}>
              Get Started
            </Button>
            <Button variant="default" radius="xl" size="md" className={classes.control} component={"a"} href={PublicUrl.Tutorial}>
              Tutorial
            </Button>
          </Group>
        </div>
        <CodeDemo />
      </div>
    </Container>
  )
}

const Copyright = () => {
  const updatedDate = new Date(publicRuntimeConfig.lastUpdated).toDateString()

  return (
    <Container size={"xl"} w={"100%"}>
      <Divider />
      <Group justify={"space-between"} mt={"md"} style={{alignItems: "center"}}>
        <Box fz={"sm"}>
          <Text c={"dimmed"} size={"sm"} mb={4} fw={500}>
            Links
          </Text>
          <Anchor c={"orange"} fz={"sm"} href={"https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html"}>Language Reference</Anchor>
          <br/>
          <Anchor c={"orange"} fz={"sm"} href={"https://classicwuhao.github.io/cyclone_tutorial/tutorial-content.html"}>Cyclone Homepage</Anchor>
        </Box>

        <Stack >
          <Text c={"dimmed"} size={"xs"}>
            This website is designed by <Anchor c={"orange"} href={"https://github.com/lucid-brndmg"}>Haoyang Lu</Anchor>.
            <br/>
            Cyclone is designed by <Anchor c={"orange"} href={"https://classicwuhao.github.io/"}>Hao Wu</Anchor>.
            <br/>
            <Anchor c={"orange"} href={"https://www.cs.nuim.ie/research/pop/"}>Principles of Programming Research Group, </Anchor>  <Anchor c={"orange"} href={"https://mu.ie"}>Maynooth University</Anchor>.
            <br/>
            Last Updated: {updatedDate}
          </Text>
        </Stack>

      </Group>

    </Container>
  )
}

const LinkCard = ({title, desc, url, color, shadow, withBorder, size, className}) => {
  return (
    <Paper p={"sm"} withBorder={withBorder} shadow={shadow} className={className} onClick={() => window.location.href = url}>
      <Text c={color} size={size} fw={500}>{title}</Text>
      <Text size={"sm"} c={"dimmed"}>{desc}</Text>
    </Paper>
  )
}

const LinksSection = () => {
  const learningLinks = [
    {title: "Online Editor", url: PublicUrl.Editor, desc: "Writing your Cyclone specifications without installing anything on your local machine."},
    {title: "VSCode Extension", url: "https://github.com/classicwuhao/CycloneVSCodePlugin", desc: "Code up your Cyclone specifications with our VSCode extension."},
    {title: "Command Line", url: "https://classicwuhao.github.io/cyclone_tutorial/installation.html", desc: "Like running everything in command-line? This is for you."}
  ]

  const resourceLinks = [
    {title: "Tutorial", desc: "A tutorial website for Cyclone", url: "https://classicwuhao.github.io/cyclone_tutorial/tutorial-content.html"},
    {title: "Reference Docs", desc: "Language reference documents", url: "https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html"},
    {title: "Cyclone Analyzer", desc: "A static analyzer for Cyclone", url: "https://github.com/lucid-brndmg/cyclone-analyzer"},
    {title: "Source Code", desc: "Source code of this website", url: "https://github.com/lucid-brndmg/cyclone-online-editor"}
  ]
  return (
    <Container size={"xl"} w={"100%"} pb={"xl"}>
      <Stack>
        <Stack>
          <Title order={3}>Using Cyclone</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {learningLinks.map((props, i) => <LinkCard
              size={"lg"}
              shadow={"none"}
              color={"orange"}
              {...props}
              key={i}
              className={"linkCardPrimary"}
            />)}
          </SimpleGrid>
        </Stack>
        <Stack mt={"lg"}>
          <Title order={3}>Useful Resources</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {resourceLinks.map((props, i) => <LinkCard
              withBorder={true}
              {...props}
              key={i}
              className={"linkCardSecondary"}
            />)}
          </SimpleGrid>
        </Stack>
      </Stack>
    </Container>
  )
}

const HomePage = () => {
  return (
    <Stack>
      <HeroSection />
      <LinksSection />
      <Copyright />
      <Space /> <Space />
    </Stack>
  )
}

export default HomePage