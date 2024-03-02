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
import rehypeExternalLinks from "rehype-external-links";

// oh es-modules...
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    .use(rehypeExternalLinks, {target: ['_blank']})
    .use(remarkGfm)
    // .use(highlight, { languages: {cyclone: highlightFn} })
    .use(rehypeStringify)
    .process(md)

  const metadata = tree?.value ? yaml.load(tree.value) : null
  const html = String(src)

  return [html, metadata]
}

const groupDocFilename = "_group"
const inputRoot = path.join(__dirname, "../raw/reference")
const outputManifest = path.join(__dirname, "../resource/reference_manifest.json")
const outputHtml = path.join(__dirname, "../public/dynamic/reference")



const manifest = []
const inputDirFiles = fs.readdirSync(inputRoot)
// const existingKeywords = new Set()

for (let dir of inputDirFiles) {
  const full = path.join(inputRoot, dir)
  if (!fs.lstatSync(full).isDirectory()) {
    continue
  }

  const docs = fs.readdirSync(full)
  const groupDef = docs.findIndex(it => it === `${groupDocFilename}.md`)
  if (groupDef === -1) {
    console.log("warn: no group definition found, skipping", full)
    continue
  }
  docs.splice(groupDef, 1)
  const groupFilename = path.join(full, `${groupDocFilename}.md`)
  // resolve group file, parse, push to manifest, set as currentNode
  const [html, groupMetadata] = await parseMarkdown(fs.readFileSync(groupFilename))
  if (!groupMetadata?.title || !groupMetadata?.id) {
    console.log("warn: invalid group file, skipping", groupFilename)
    continue
  }
  groupMetadata.documents = []
  const groupPath = path.join(outputHtml, groupMetadata.id)
  fs.mkdirSync(groupPath, {recursive: true})
  if (html) {
    groupMetadata.html = true // html
    fs.writeFileSync(path.join(groupPath, `${groupDocFilename}.html`), html)
  }

  for (let doc of docs) {
    const docFilename = path.join(full, doc)
    const [html, metadata] = await parseMarkdown(fs.readFileSync(docFilename))
    if (!html || !metadata || !metadata.title || !metadata.id || metadata.id === groupDocFilename) {
      console.log("warn: invalid markdown file, skipping", docFilename)
      continue
    }

    const keywords = metadata.keywords || []
    if (metadata.keyword) {
      keywords.push(metadata.keyword)
      delete metadata.keyword
    }

    fs.writeFileSync(path.join(groupPath, `${metadata.id}.html`), html)

    groupMetadata.documents.push({
      ...metadata,
      keywords,
      // html: true
    })
  }

  manifest.push(groupMetadata)
}

fs.writeFileSync(outputManifest, JSON.stringify(manifest), "utf8")
console.log("reference generated")