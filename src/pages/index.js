import Head from 'next/head'
import HomePage from "@/component/home";

// home page
const Home = () => {
  return (
    <>
      <Head>
        <title>Cyclone Specification Language</title>
        <meta name={"description"} content={"Cyclone is a graph-based specification language"}/>
        <meta name={"keywords"} content={"cyclone, specification language, graphs"}/>

        <meta property="og:site_name" content="Cyclone" />
        <meta property="og:type" content="object" />
        <meta property="og:title" content="Cyclone: A Graph-Based Specification Language"/>
        <meta name={"og:description"} content={"Cyclone is a graph-based specification language"}/>
      </Head>
      <main>
        <HomePage />
      </main>
    </>
  )
}

export default Home