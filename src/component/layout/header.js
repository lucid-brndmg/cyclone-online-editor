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
  IconQuestionMark, IconSettings,
  IconShare2,
  IconShare3
} from "@tabler/icons-react";
import {HelpModal} from "@/component/modal/helpModal";
import {SettingsPopover} from "@/component/editor/settings";
import {PublicUrl} from "@/core/utils/resource";

const links = [
  { link: PublicUrl.Home, label: 'Home' },
  { link: PublicUrl.Tutorial, label: 'Tutorial' },
  { link: PublicUrl.Editor, label: 'Editor' },
];

const CycloneLogo = ({...props}) => {
  const router = useRouter()

  return (
    <Group {...props} gap={"xs"} style={{cursor: "pointer", userSelect: "none"}} onClick={() => router.push(PublicUrl.HomeBase)}>
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

  const path = router.basePath + router.pathname
  // This state & effect is needed to please NextJS from throwing "Hydration failed because the initial UI does not match what was rendered on the server"
  const [nextJsPleasedColorScheme, setNextJsPleasedColorScheme] = useState("light")
  useEffect(() => {
    setNextJsPleasedColorScheme(computedColorScheme)
  }, [computedColorScheme]);

  const items = links.map((link) => {
    const activeStyle = ((link.link !== PublicUrl.Home && path.startsWith(link.link)) || (link.link === PublicUrl.Home && path === link.link))
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
          <SettingsPopover>
            <Tooltip label="Settings">
              <ActionIcon size={"lg"} variant="default" aria-label="Settings">
                <IconSettings style={{ width: '70%', height: '70%' }} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </SettingsPopover>

          <Tooltip label="Source Code">
            <ActionIcon component={"a"} target="_blank" href={"https://github.com/lucid-brndmg/cyclone-online-editor"} size={"lg"} variant="default" aria-label="Source Code">
              <IconBrandGithub style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>



          <Tooltip label="Help">
            <ActionIcon onClick={() => setHelpOpened(true)} size={"lg"} variant="default" aria-label="Help">
              <IconHelpCircle style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={`Switch to ${destColorMode} mode`}>
            <ActionIcon size={"lg"} onClick={() => setColorScheme(destColorMode)} variant="default" aria-label="Toggle Color Mode">
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