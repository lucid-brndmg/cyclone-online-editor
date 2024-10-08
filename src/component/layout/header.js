import {
  Group,
  Text, ActionIcon, useMantineColorScheme, useComputedColorScheme, Tooltip
} from "@mantine/core";
import {useEffect, useState} from "react";
import classes from "../../styles/modules/LayoutHeader.module.css";
import NextImage from 'next/image';
import logo from '../../../resource/image/logo.png'
import {useRouter} from "next/router";
import {
  IconBrandGithub,
  IconBrightnessUp, IconHelpCircle, IconMoon,
  IconSettings
} from "@tabler/icons-react";
import HelpModal from "@/component/modal/helpModal";
import {SettingsPopover} from "@/component/editor/settings";
import {PublicUrl} from "@/core/utils/resource";

const links = [
  { link: PublicUrl.Home, label: 'Home' },
  { link: PublicUrl.Tutorial, label: 'Tutorial' },
  { link: PublicUrl.Editor, label: 'Editor' },
];

const activeStyle = {
  backgroundColor: "var(--mantine-color-orange-filled)",
  color: "var(--mantine-color-white)"
}

const CycloneLogo = ({...props}) => {
  const router = useRouter()
  return (
    <Group {...props} gap={"xs"} style={{cursor: "pointer", userSelect: "none"}} onClick={() => router.push(PublicUrl.HomeBase)}>
      <NextImage width={28} height={28}  src={logo} alt="cyclone logo" />
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
  const [settingsOpened, setSettingsOpened] = useState(false)

  const path = router.basePath + router.pathname
  // This state & effect is needed to please NextJS from throwing "Hydration failed because the initial UI does not match what was rendered on the server"
  const [nextJsPleasedColorScheme, setNextJsPleasedColorScheme] = useState("light")
  useEffect(() => {
    setNextJsPleasedColorScheme(computedColorScheme)
  }, [computedColorScheme]);

  const items = links.map((link) => {
    const style = ((link.link !== PublicUrl.Home && path.startsWith(link.link)) || (link.link === PublicUrl.Home && path === link.link))
      ? activeStyle
      : null
    return (
      <a
        key={link.label}
        href={link.link}
        className={classes.link}
        style={style}
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
          {path.startsWith(PublicUrl.Editor) || path.startsWith(PublicUrl.Tutorial)
            ? <SettingsPopover opened={settingsOpened} onChange={setSettingsOpened}>
              <Tooltip label="Settings">
                <ActionIcon size={"lg"} variant="default" aria-label="Settings" onClick={() => setSettingsOpened(!settingsOpened)}>
                  <IconSettings style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </SettingsPopover>
            : null
          }


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