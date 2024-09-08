import {useRouter} from "next/router";
import Head from "next/head";
import {SharedCodePreview} from "@/component/share/preview";
import {Container, LoadingOverlay} from "@mantine/core";
import {useMemo} from "react";
import lzString from "lz-string"


const SharePage = () => {
  const router = useRouter()
  const encoded = router.query.encoded
  const decoded = useMemo(() => {
    if (encoded?.trim().length) {
      try {
        return JSON.parse(lzString.decompressFromEncodedURIComponent(encoded))
      } catch (e) {
        return null
      }
    }

    return null
  }, [encoded])

  return (
    <>
      <Head>
        <title>{decoded?.title + `${decoded?.title ? " - " : ""}Shared Code`}</title>
      </Head>

      <main>
        <Container>
          {decoded ? <SharedCodePreview shared={decoded} /> : <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} /> }
        </Container>
      </main>

    </>
  )
}

export default SharePage