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
  const fullTitle = `Cyclone Tutorial: ${title}`
  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name={"description"} content={"Tutorial documents of Cyclone"}/>
        <meta name={"keywords"} content={"cyclone, tutorial"}/>

        <meta property="og:site_name" content={fullTitle} />
        <meta property="og:type" content="object" />
        <meta property="og:title" content={fullTitle}/>
        <meta name={"og:description"} content={"Tutorial documents of Cyclone"}/>
      </Head>
      <main>
        <TutorialPanel html={html} id={id} />
      </main>
    </>
  )
}

export default TutorialChapterPage