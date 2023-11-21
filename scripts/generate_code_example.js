const fs = require("fs")
const path = require("path")

const inputDir = path.join(__dirname, "../raw/code_example")
const outputFile = path.join(__dirname, "../resource/code_example_manifest.json")
const publicDir = path.join(__dirname, "../public/dynamic/code_example")
const inputDirFiles = fs
  .readdirSync(inputDir)
  .filter(name => name.endsWith(".cyclone"))

const manifest = []

let id = 0
const assignId = () => `man-${id ++}`

for (let file of inputDirFiles) {
  const id = assignId()
  // const fileContent = fs.readFileSync(path.join(inputDir, file), "utf8")
  fs.copyFileSync(path.join(inputDir, file), path.join(publicDir, `${id}.cyclone`))
  const filename = path.parse(file).name
  manifest.push({
    id,
    title: filename,
    // code: fileContent,
  })
}

fs.writeFileSync(outputFile, JSON.stringify(manifest), "utf8")
console.log("code examples generated")