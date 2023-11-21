const path = require("path")
const fs = require("fs")

const themePaths = [
  path.join(__dirname, "../node_modules/monaco-themes/themes")
]

const output = path.join(__dirname, "../resource/theme_manifest.json")
const relativeThemePublicPath = "/dynamic/theme"
const absoluteThemePublicPath = path.join(__dirname, `../public${relativeThemePublicPath}`)

const manifest = []

for (let themePath of themePaths) {
  const files = fs.readdirSync(themePath)

  for (let file of files) {
    if (!file.endsWith(".json")) {
      continue
    }
    const title = path.parse(file).name
    const ident = title
      .split(" ").join("-")
      .split("(").join("-")
      .split(")").join("-")
    const identFile = `${ident}.json`
    fs.copyFileSync(path.join(themePath, file), path.join(absoluteThemePublicPath, identFile))

    manifest.push({
      title,
      ident,
      // file: path.join(relativeThemePublicPath, identFile)
      //   .replace(/\\/g, '/'),
    })
  }
}



fs.writeFileSync(output, JSON.stringify(manifest), "utf8")
console.log("themes generated")