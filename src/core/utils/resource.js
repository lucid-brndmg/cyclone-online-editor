const publicUrl = process.env.PUBLIC_URL || ''

// export const urlOf = url => `${publicUrl}${url}`

export const PublicUrl = {
  Editor: `${publicUrl}/editor`,
  Tutorial: `${publicUrl}/tutorial`,
  Home: publicUrl + "/",
  MonacoScripts: `${publicUrl}/vs`,

  TutorialBase: "/tutorial",
  EditorBase: "/editor",
  HomeBase: "/",
  Dynamic: `${publicUrl}/dynamic`
}

// const dynamicResource = path => `${PublicUrl.Dynamic}${path}`

export const dynamicTheme = themeIdent => `${PublicUrl.Dynamic}/theme/${themeIdent}.json`

export const dynamicCodeExample = id => `${PublicUrl.Dynamic}/code_example/${id}.cyclone`

export const dynamicReferenceDoc = (groupId, isGroup, docId = null) => `${PublicUrl.Dynamic}/reference/${isGroup ? `${groupId}/_group.html` : `${groupId}/${docId}.html`}`