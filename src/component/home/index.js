import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Group,
  List, Paper,
  rem,
  ScrollArea, SimpleGrid, Space,
  Stack,
  Text,
  ThemeIcon,
  Title,
  TypographyStylesProvider
} from "@mantine/core";
import {IconCheck} from "@tabler/icons-react";
import classes from "../../styles/modules/HeroSection.module.css"
import hljs from "highlight.js";
import {useEffect, useState} from "react";
import hljsCyclone from "@/generated/hljs/cyclone";
import Config from "../../../resource/config.json"
import {CycloneLanguageId} from "@/core/monaco/language";
import {ExecutableCode} from "@/component/tutorial/code";
import localforage from "localforage";
import {useRouter} from "next/router";

/*
* Reference: https://ui.mantine.dev/category/hero/
* */

const HeroSection = () => {
  const [exampleCode, setExampleCode] = useState("")
  const router = useRouter()

  useEffect(() => {
    hljs.registerLanguage(CycloneLanguageId, hljsCyclone)
    const highlightedCode = hljs.highlight(
      Config.home.exampleCode,
      { language: CycloneLanguageId }
    ).value
    setExampleCode(highlightedCode)
  }, [])

  const onTry = async () => {
    await localforage.setItem("tmp_code", Config.home.exampleCode)
    await router.push("/playground")
  }

  return (
    <Container size="xl">
      <div className={classes.inner}>
        <div className={classes.content}>
          <Title className={classes.title}>
            A <span className={classes.highlight}>graph-based</span> specification language
          </Title>
          <Text c="dimmed" mt="md">
            Solve graph-based problems by writing a few lines of code & provide a general solution to problems that can be described as a graph.
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
              <b>Graph-Based</b> – Describe states or nodes and edges that connect them. Solve the problem by finding paths
            </List.Item>
            <List.Item>
              <b>Simple & Straightforward</b> – Solve complicated questions by writing a few line of code with a very simple syntax.
            </List.Item>
            <List.Item>
              <b>Edit Online</b> – Use the online editor to unlock the full experience of Cyclone. Code lens, reference docs and visualization engine are ready.
            </List.Item>
          </List>

          <Group mt={30}>
            <Button radius="xl" size="md" className={classes.control} color={"orange"} component={"a"} href={"/tutorial"}>
              Get Started
            </Button>
            <Button variant="default" radius="xl" size="md" className={classes.control} component={"a"} href={"/playground"}>
              Playground
            </Button>
          </Group>
        </div>
        {/* <Image src={image.src} className={classes.image} /> */}
        <ScrollArea className={classes.display}>
          <TypographyStylesProvider fz={"sm"} p={0}>
            <ExecutableCode execCode={Config.home.exampleCode} onTry={onTry}>
              <pre style={{whiteSpace: "pre-wrap"}} dangerouslySetInnerHTML={{__html: exampleCode}} />
            </ExecutableCode>
          </TypographyStylesProvider>
        </ScrollArea>
      </div>
    </Container>
  )
}

const Copyright = () => {
  return (
    <Container size={"xl"} w={"100%"}>
      <Divider />
      <Group justify={"space-between"} mt={"md"} style={{alignItems: "center"}}>
        <Group style={{alignItems: "flex-start"}}>
          <Box fz={"sm"}>
            <Text c={"dimmed"} size={"sm"} mb={4} fw={500}>
              Links
            </Text>
            <Anchor c={"orange"} fz={"sm"} href={"https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html"}>Language Reference</Anchor>
            <br/>
            <Anchor c={"orange"} fz={"sm"} href={"https://cyclone4web.cs.nuim.ie/editor/"}>Another Cyclone Playground</Anchor>
            <br/>
            <Anchor c={"orange"} fz={"sm"} href={"https://classicwuhao.github.io/cyclone_tutorial/tutorial-content.html"}>Cyclone Homepage</Anchor>
          </Box>
          <Box fz={"sm"}>
            <Text c={"dimmed"} size={"sm"} mb={4} fw={500}>
              Source Codes
            </Text>
            <Anchor c={"orange"} fz={"sm"} href={"https://github.com/lucid-brndmg/cyclone-online-editor"}>This Website</Anchor>
            <br/>
            <Anchor c={"orange"} fz={"sm"} href={"https://github.com/classicwuhao/Cyclone"}>Cyclone Language</Anchor>
          </Box>

        </Group>

        <Stack >
          <Text c={"dimmed"} size={"xs"}>
            THIS WEBSITE IS CODED BY <Anchor c={"orange"} href={"https://github.com/lucid-brndmg"}>HAOYANG LU</Anchor> AS A FINAL YEAR PROJECT AT MAYNOOTH UNIVERSITY GUIDED BY DR. HAO WU.
            <br/>
            CYCLONE IS A LANGUAGE DESIGNED BY <Anchor c={"orange"} href={"https://classicwuhao.github.io/"}>HAO WU</Anchor>.
            <br/>
            <Anchor c={"orange"} href={"https://www.cs.nuim.ie/research/pop/"}>PRINCIPLES OF PROGRAMMING RESEARCH GROUP</Anchor> © 2023 <Anchor c={"orange"} href={"https://mu.ie"}>MAYNOOTH UNIVERSITY</Anchor>
          </Text>
        </Stack>

      </Group>

    </Container>
  )
}

const LinkCard = ({title, desc, url, color, shadow, withBorder, size}) => {
  return (
    <Paper p={"sm"} withBorder={withBorder} shadow={shadow} style={{cursor: "pointer"}} onClick={() => window.location.href = url}>
      <Text c={color} size={size} fw={500}>{title}</Text>
      <Text size={"sm"} c={"dimmed"}>{desc}</Text>
    </Paper>
  )
}

const LinksSection = () => {
  const learningLinks = [
    {title: "Learn", url: "/tutorial", desc: "Learning The Cyclone Language and trying the code inside the tutorials"},
    {title: "Online Editor", url: "/playground", desc: "Writing Cyclone using the online development environment"},
    {title: "Installation", url: "https://classicwuhao.github.io/cyclone_tutorial/installation.html", desc: "Install Cyclone on your local machine"}
  ]

  const resourceLinks = [
    {title: "Reference Docs", desc: "Language reference documents", url: "https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html"},
    {title: "Another Online Editor", desc: "A simpler online Cyclone editor", url: "https://cyclone4web.cs.nuim.ie/editor/"},
    {title: "Official Tutorials", desc: "Official tutorial website for Cyclone without an online editor", url: "https://classicwuhao.github.io/cyclone_tutorial/tutorial-content.html"},
    {title: "Source Code", desc: "Source code of the Cyclone specification language", url: "https://github.com/classicwuhao/Cyclone"}
  ]
  return (
    <Container size={"xl"} w={"100%"} pb={"xl"}>
      <Stack>
        <Stack>
          <Title order={3}>Learning & Developing</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {learningLinks.map((props, i) => <LinkCard size={"lg"} shadow={"md"} color={"orange"} {...props} key={i} />)}
          </SimpleGrid>
        </Stack>
        <Stack mt={"lg"}>
          <Title order={3}>Useful Resources</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {resourceLinks.map((props, i) => <LinkCard withBorder={true} {...props} key={i} />)}
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