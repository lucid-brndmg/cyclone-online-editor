import '@mantine/core/styles.css';
import {createTheme, MantineProvider, useComputedColorScheme} from '@mantine/core';
import {LayoutHeader} from "@/component/layout/header";
import {ModalsProvider} from "@mantine/modals";
import {useEffect, useRef, useState} from "react";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import {useDebouncedValue} from "@mantine/hooks";
import "../styles/global.css"
import {hljsTheme} from "@/core/utils/highlight";
import Head from "next/head";

const theme = createTheme({
  /** Put your mantine theme override here */
});

const CodeHighlightProvider = ({children}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  useEffect(() => {
    document.querySelector("#hljs-theme")?.remove()
    const style = document.createElement("style")
    style.id = "hljs-theme"
    style.textContent = hljsTheme[computedColorScheme]
    document.head.appendChild(style)
  }, [computedColorScheme]);

  return children
}

export default function App({ Component, pageProps }) {
  const {initOnLoad, syncOnSave} = useEditorSettingsStore()
  const [syncTime, setSyncTime] = useState(Date.now())
  // debounce here for drag width & height
  const [debounced] = useDebouncedValue(syncTime, 100)

  useEffect(() => {
    syncOnSave()
  }, [debounced]);

  useEffect(() => {
    initOnLoad().then(() => {
      useEditorSettingsStore.subscribe(async () => {
        setSyncTime(Date.now())
      })
    })
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <LayoutHeader />
          <CodeHighlightProvider>
            <Component {...pageProps} />
          </CodeHighlightProvider>
        </ModalsProvider>
      </MantineProvider>
    </>
  )
}
