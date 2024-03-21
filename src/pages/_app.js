import '@mantine/core/styles.css';
import {createTheme, MantineProvider, useComputedColorScheme} from '@mantine/core';
import {LayoutHeader} from "@/component/layout/header";
import {ModalsProvider} from "@mantine/modals";
import {useEffect, useState} from "react";
import {useEditorSettingsStore} from "@/state/editorSettingsStore";
// import "../styles/hljsOneLight.css"
import {useDebouncedValue} from "@mantine/hooks";
import "../styles/global.css"

const theme = createTheme({
  /** Put your mantine theme override here */
});

const CodeHighlightProvider = ({children}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  useEffect(() => {
    if (computedColorScheme === "light") {
      import("../styles/hljsOneLight.css")
    } else {
      import("../styles/hljsOneDark.css")
    }
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
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <LayoutHeader />
        <CodeHighlightProvider>
          <Component {...pageProps} />
        </CodeHighlightProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}
