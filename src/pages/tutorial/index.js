import {TutorialPanel} from "@/component/tutorial/panel";
import fs from "fs";
import path from "path";
import Head from "next/head";

export async function getStaticProps() {
  // const res = await fetch(`${config.publicUrl}${dynamicTutorial("_default")}`)
  // const html = await res.text()
  const html = await fs.promises.readFile(path.join(process.cwd(), `./resource/tutorial/_default.html`), "utf8")
  return { props: { html } }
}

const TutorialPage = ({html}) => {
  return (
    <>
      <Head>
        <title>Cyclone Tutorial</title>
      </Head>
      <main>
        <TutorialPanel html={html} id={"_default"} />
      </main>
    </>
  )
}

export default TutorialPage