import Head from 'next/head'
import HomePage from "@/component/home";

const Home = () => {
  return (
    <>
      <Head>
        <title>Cyclone Specification Language</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* <link rel="icon" href={`${process.env.PUBLIC_URL}/favicon.ico`} /> */}
      </Head>
      <main>
        <HomePage />
      </main>
    </>
  )
}

export default Home