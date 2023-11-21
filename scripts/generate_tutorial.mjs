import {unified} from "unified";
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import {select} from "unist-util-select";
import yaml from "js-yaml";
import fs from "node:fs"
import path from "node:path"
import {fileURLToPath} from "url"
import highlight from 'rehype-highlight'
import cycloneSpecCode from "./utils/highlight_spec.mjs"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const specFile = path.join(__dirname, "../resource/cyclone_spec.json")
const spec = JSON.parse(fs.readFileSync(specFile, "utf8"))

const highlightFn = eval(cycloneSpecCode(spec))

const parseMarkdown = async md => {
  let tree = null

  const src = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(() => t => {
      tree = select("yaml", t)
      return t
    })
    .use(remarkRehype)
    .use(remarkGfm)
    .use(highlight, { languages: {cyclone: highlightFn} })
    .use(rehypeStringify)
    .process(md)

  const metadata = tree?.value ? yaml.load(tree.value) : null
  const html = String(src)

  return [html, metadata]
}

const defaultDocFilename = "_default.md"
const inputRoot = path.join(__dirname, "../raw/tutorial")
const outputFile = path.join(__dirname, "../resource/tutorial_manifest.json")
const htmlFilePath = path.join(__dirname, "../resource/tutorial")

const manifest = []
const inputDirFiles = fs.readdirSync(inputRoot)
let defaultManifestItem = null

for (let mdFile of inputDirFiles) {
  if (!mdFile.endsWith(".md")) {
    console.log("skipping non markdown file", mdFile)
    continue
  }
  const full = path.join(inputRoot, mdFile)
  const isDefault = mdFile === defaultDocFilename
  const [html, metadata] = await parseMarkdown(fs.readFileSync(full))
  const id = metadata.id ?? path.parse(mdFile).name
  const htmlFile = `${id}.html`
  fs.writeFileSync(path.join(htmlFilePath, htmlFile), html)
  if (!isDefault) {
    manifest.push({...metadata, id})
  } else {
    defaultManifestItem = {...metadata, id}
  }
}

manifest.sort((a, b) => a.order - b.order)

for (let m of manifest) {
  // order is no-longer needed after sorting
  // reduce the manifest size
  delete m.order
}

fs.writeFileSync(outputFile, JSON.stringify([defaultManifestItem, ...manifest]), "utf8")
console.log("tutorial generated")