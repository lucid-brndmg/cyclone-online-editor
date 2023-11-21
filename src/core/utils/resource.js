export const dynamicResource = path => `/dynamic${path}`

export const dynamicTheme = themeIdent => dynamicResource(`/theme/${themeIdent}.json`)

export const dynamicCodeExample = id => dynamicResource(`/code_example/${id}.cyclone`)

export const dynamicTutorial = title => dynamicResource(`/tutorial/${title}.html`)

export const dynamicReferenceDoc = (groupId, isGroup, docId = null) => dynamicResource(`/reference/${isGroup ? `${groupId}/_group.html` : `${groupId}/${docId}.html`}`)