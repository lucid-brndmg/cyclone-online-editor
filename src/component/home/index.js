import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Group,
  List,
  rem,
  ScrollArea,
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

/*
* Reference: https://ui.mantine.dev/category/hero/
* */

const HeroSection = () => {
  const [exampleCode, setExampleCode] = useState("")

  useEffect(() => {
    hljs.registerLanguage(CycloneLanguageId, hljsCyclone)
    const highlightedCode = hljs.highlight(
      Config.home.exampleCode,
      { language: CycloneLanguageId }
    ).value
    setExampleCode(highlightedCode)
  }, [])

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
              <b>Based on graph</b> – Describe states or nodes and edges that connect them. Solve the problem by finding paths
            </List.Item>
            <List.Item>
              <b>Powered by Z3</b> – Language based on the powerful z3 engine to ensure the correctness of its result
            </List.Item>
            <List.Item>
              <b>Simple & straightforward</b> – Solve complicated questions by writing a few line of code. Visualization engine & semantic checker are also ready
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
            <pre dangerouslySetInnerHTML={{__html: exampleCode}} />
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
            <Anchor fz={"sm"} href={"https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html"}>Language Reference</Anchor>
            <br/>
            <Anchor fz={"sm"} href={"https://cyclone4web.cs.nuim.ie/editor/"}>Another Cyclone Playground</Anchor>
            <br/>
            <Anchor fz={"sm"} href={"https://classicwuhao.github.io/cyclone_tutorial/tutorial-content.html"}>Cyclone Homepage</Anchor>
          </Box>
          <Box fz={"sm"}>
            <Text c={"dimmed"} size={"sm"} mb={4} fw={500}>
              Source Codes
            </Text>
            <Anchor fz={"sm"} href={"https://github.com/lucid-brndmg/cyclone-online-editor"}>This Website</Anchor>
            <br/>
            <Anchor fz={"sm"} href={"https://github.com/classicwuhao/Cyclone"}>Cyclone Language</Anchor>
          </Box>

        </Group>

        <Stack >
          <Text c={"dimmed"} size={"xs"}>
            THIS WEBSITE IS CODED BY <Anchor href={"https://github.com/lucid-brndmg"}>HAOYANG LU</Anchor> AS A FINAL YEAR PROJECT AT MAYNOOTH UNIVERSITY GUIDED BY DR. HAO WU.
            <br/>
            CYCLONE IS A LANGUAGE DESIGNED BY <Anchor href={"https://classicwuhao.github.io/"}>HAO WU</Anchor>.
            <br/>
            <Anchor href={"https://www.cs.nuim.ie/research/pop/"}>PRINCIPLES OF PROGRAMMING RESEARCH GROUP</Anchor> © 2023 <Anchor href={"https://mu.ie"}>MAYNOOTH UNIVERSITY</Anchor>
          </Text>
        </Stack>

      </Group>

    </Container>
  )
}

const HomePage = () => {
  return (
    <Stack>
      <HeroSection />
      <Copyright />
    </Stack>
  )
}

export default HomePage