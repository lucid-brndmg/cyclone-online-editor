import '@mantine/core/styles.css';
import {createTheme, MantineProvider} from '@mantine/core';
import {LayoutHeader} from "@/component/layout/header";
import {ModalsProvider} from "@mantine/modals";
import {useEffect, useState} from "react";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
import "../styles/hljsOneDark.css"
import {useDebouncedValue} from "@mantine/hooks";

const theme = createTheme({
  /** Put your mantine theme override here */
});

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
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <LayoutHeader />
        <Component {...pageProps} />
      </ModalsProvider>
    </MantineProvider>
  )
}
