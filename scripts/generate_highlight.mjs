import cycloneSpecCode from "./utils/highlight_spec.mjs";
import path from "node:path";
import fs from "node:fs";
import {fileURLToPath} from "node:url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const specFile = path.join(__dirname, "../resource/cyclone_spec.json")
const highlightGeneratedFile = path.join(__dirname, "../src/generated/hljs/cyclone.js")
const spec = JSON.parse(fs.readFileSync(specFile, "utf8"))

const generateHighlightCode = () => {
  const ident = "spec"
  const specCode = cycloneSpecCode(spec, ident)
  const specConfPath = path
    .relative(highlightGeneratedFile, specFile)
    .replace(/\\/g, '/')
    .slice(3) // slice one "../"
  const code = `import ${ident} from "${specConfPath}"
export default ${specCode}
`
  fs.writeFileSync(highlightGeneratedFile, code)
}

generateHighlightCode()