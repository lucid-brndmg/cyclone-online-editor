import {
  Burger,
  Group,
  Container,
  Image,
  Text, ThemeIcon, ActionIcon, Space, useMantineColorScheme, useComputedColorScheme, Tooltip
} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import {useEffect, useState} from "react";
import classes from "../../styles/modules/LayoutHeader.module.css";
import NextImage from 'next/image';
import logo from '../../../resource/image/logo.png'
import Link from "next/link";
import {useRouter} from "next/router";
import {
  IconBrandGithub,
  IconBrightnessUp, IconHelpCircle, IconHelpCircleFilled,
  IconLink,
  IconMoon,
  IconQuestionMark,
  IconShare2,
  IconShare3
} from "@tabler/icons-react";
import {HelpModal} from "@/component/modal/helpModal";

const links = [
  { link: '/', label: 'Home' },
  { link: '/tutorial', label: 'Tutorial' },
  { link: '/playground', label: 'Playground' },
];

const CycloneLogo = ({...props}) => {
  const router = useRouter()

  return (
    <Group {...props} gap={"xs"} style={{cursor: "pointer", userSelect: "none"}} onClick={() => router.push("/")}>
      <Image width={28} height={28} component={NextImage} src={logo} alt="cyclone logo" />
      <Text fw={500} size={"lg"}>CYCLONE</Text>
    </Group>
  )
}

export const LayoutHeader = () => {
  const router = useRouter()
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const destColorMode = computedColorScheme === "light" ? "dark" : "light"
  const [helpOpened, setHelpOpened] = useState(false)

  const path = router.pathname
  // This state & effect is needed to please NextJS from throwing "Hydration failed because the initial UI does not match what was rendered on the server"
  const [nextJsPleasedColorScheme, setNextJsPleasedColorScheme] = useState("light")
  useEffect(() => {
    setNextJsPleasedColorScheme(computedColorScheme)
  }, [computedColorScheme]);

  const items = links.map((link) => {
    const activeStyle = ((link.link !== "/" && path.startsWith(link.link)) || (link.link === "/" && path === link.link))
      ? {
        backgroundColor: "var(--mantine-color-orange-filled)",
        color: "var(--mantine-color-white)"
      }
      : null
    return (
      <a
        key={link.label}
        href={link.link}
        className={classes.link}
        style={activeStyle}
        target={link.target ? link.target : undefined}
      >
        {link.label}
      </a>
    )
  });

  return (
    <header className={classes.header}>
      <HelpModal opened={helpOpened} onOpened={setHelpOpened} />

      <Group justify={"space-between"} px={"md"} className={classes.inner}>
        <CycloneLogo />
        <Group>
          {items}
        </Group>
        <Group>
          <Tooltip label="Language Reference">
            <ActionIcon component={"a"} target="_blank" href={"https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html"} size={"lg"} variant="default" aria-label="Github">
              <IconLink style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Github">
            <ActionIcon component={"a"} target="_blank" href={"https://github.com/classicwuhao/Cyclone"} size={"lg"} variant="default" aria-label="Github">
              <IconBrandGithub style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Help">
            <ActionIcon onClick={() => setHelpOpened(true)} size={"lg"} variant="default" aria-label="Github">
              <IconHelpCircle style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={`Switch to ${destColorMode} mode`}>
            <ActionIcon size={"lg"} onClick={() => setColorScheme(destColorMode)} variant="default" aria-label="Color Mode">
              {
                nextJsPleasedColorScheme === "light"
                  ? <IconMoon style={{ width: '70%', height: '70%' }} stroke={1.5} />
                  : <IconBrightnessUp style={{ width: '70%', height: '70%' }} stroke={1.5} />
              }
            </ActionIcon>
          </Tooltip>


        </Group>
      </Group>
    </header>
  )
}