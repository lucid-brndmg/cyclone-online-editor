import {TutorialPanel} from "@/component/tutorial/panel";
import fs from "fs"
import path from "path";
import tutorialManifest from "../../../../resource/tutorial_manifest.json"
import {tutorialTable} from "@/core/resources/tutorial";
import Head from "next/head";

export async function getStaticPaths() {
  return {
    paths: tutorialManifest.map(({id}) => ({params: {id}})),
    fallback: false
  }
}
export async function getStaticProps(ctx) {
  const id = ctx.params.id
  const html = await fs.promises.readFile(path.join(process.cwd(), `./resource/tutorial/${id}.html`), "utf8")
  const title = tutorialTable[id].title
  return { props: { html, id, title } }
}

const TutorialChapterPage = ({html, id, title}) => {
  return (
    <>
      <Head>
        <title>Cyclone Tutorial: {title}</title>
      </Head>
      <main>
        <TutorialPanel html={html} id={id} />
      </main>
    </>
  )
}

export default TutorialChapterPage