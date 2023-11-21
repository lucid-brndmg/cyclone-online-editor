import {ErrorPageTemplate} from "@/component/utils/error";

const Page500 = () => {
  return (
    <ErrorPageTemplate
      code={500}
      title={"Error Occurred"}
      description={"Something wrong happened to the server. Please retry later."}
    />
  )
}

export default Page500