import referenceManifest from "../../../resource/reference_manifest.json"
import {dynamicReferenceDoc} from "@/core/utils/resource";

const keywordDocuments = (() => {
  const results = {}

  for (let i = 0; i < referenceManifest.length; i++) {
    const group = referenceManifest[i]
    for (let j = 0; j < group.documents.length; j++) {
      const doc = group.documents[j]
      if (doc.keywords) {
        for (let k of doc.keywords) {
          // const html = `<p><b>${doc.title}</b></p>${doc.html}`
          if (results[k]) {
            // results[k].push({id: doc.id, isGroup: false, groupId: group.id, title: doc.title})
            results[k].push({isGroup: false, groupIdx: i, docIdx: j})
          } else {
            results[k] = [{isGroup: false, groupIdx: i, docIdx: j}]
          }
        }
      }
    }

    const groupKeywords = group.keywords || []

    if (group.html) {
      for (let k of groupKeywords) {
        // const html = `<p><b>${group.title}</b></p>${group.html}`
        if (results[k]) {
          results[k].push({isGroup: true, groupIdx: i})
        } else {
          results[k] = [{isGroup: true, groupIdx: i}]
        }
      }
    }
  }

  return results
})()

const cachedHtml = new Map()

// const buildUrl = (groupId, isGroup, id = null) => `/dynamic/reference/${isGroup ? `${groupId}/_group.html` : `${groupId}/${id}.html`}`

const fetchHtml = (url) => fetch(url).then(async resp => {
  const text = await resp.text()
  cachedHtml.set(url, text)
  return text
})

export const getKeywordHoverDocument = async kwd => {
  const ids = keywordDocuments[kwd]
  if (!ids?.length) {
    return []
  }

  try {
    const docs = await Promise.all(ids.map(({groupIdx, docIdx, isGroup}) => {
      const group = referenceManifest[groupIdx]
      const doc = group?.documents[docIdx]
      const title = doc ? doc.title : group.title
      const url = dynamicReferenceDoc(group.id, isGroup, doc?.id) // `/dynamic/reference/${group.id}/${isGroup ? "_group.html" : (doc.id + ".html")}`
      if (cachedHtml.has(url)) {
        const text = cachedHtml.get(url)
        return `<p><b>${title}</b></p>${text}`
      }
      return fetch(url).then(async resp => {
        const text = await resp.text()
        cachedHtml.set(url, text)
        return `<p><b>${title}</b></p>${text}`
      })
    }))

    return docs
  } catch (e) {
    console.log(e)
    return []
  }
}

export const getGroupDocument = async groupId => {
  const url = dynamicReferenceDoc(groupId, true)
  if (cachedHtml.has(url)) {
    return cachedHtml.get(url)
  }

  return fetchHtml(url)
}

export const getDocumentById = async (groupId, docId) => {
  const url = dynamicReferenceDoc(groupId, false, docId)
  if (cachedHtml.has(url)) {
    return cachedHtml.get(url)
  }

  return fetchHtml(url)
}
