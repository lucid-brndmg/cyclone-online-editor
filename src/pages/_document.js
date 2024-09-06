import {Head, Html, Main, NextScript} from 'next/document'
import {ColorSchemeScript} from "@mantine/core";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <link rel="icon" href={`${process.env.PUBLIC_URL}/favicon.ico`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body>
      <Main />
      <NextScript />
      </body>
    </Html>
  )
}
