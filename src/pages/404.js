import {ErrorPageTemplate} from "@/component/utils/error";

const Page404 = () => {
  return (
    <ErrorPageTemplate
      code={404}
      title={"Not Found"}
      description={"This page does not exist."}
    />
  )
}

export default Page404