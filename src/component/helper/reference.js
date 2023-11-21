import referenceManifest from "../../../resource/reference_manifest.json"
import {
  Accordion,
  Anchor,
  Box,
  Divider, LoadingOverlay,
  NavLink,
  Stack,
  Text,
  TypographyStylesProvider
} from "@mantine/core";
import {IconChevronRight, IconCircleFilled} from "@tabler/icons-react";
import {useEffect, useMemo, useRef, useState} from "react";
// import "highlight.js/styles/atom-one-dark.min.css";
import hljs from "highlight.js";
import hljsCyclone from "../../generated/hljs/cyclone"
import {getDocumentById, getGroupDocument} from "@/core/referenceDocs";
import {CycloneLanguageId} from "@/core/monaco/language";

const DocItem = ({group, doc}) => {
  const [docContent, setDocContent] = useState(null)

  useEffect(() => {
    getDocumentById(group.id, doc.id).then(html => {
      setDocContent(html)
    })
  }, [])

  useEffect(() => {
    if (docContent) {
      hljs.highlightAll()
    }
  }, [docContent]);


  return (
    <TypographyStylesProvider p={0} fz={"sm"} pos={"relative"}>
      <LoadingOverlay visible={docContent == null} />
      <div dangerouslySetInnerHTML={{ __html: docContent || "" }} />
    </TypographyStylesProvider>
  )
}

const GroupItem = ({group}) => {
  const [groupDoc, setGroupDoc] = useState(null)
  const [openedDocs, setOpenedDocs] = useState(new Set())

  useEffect(() => {
    if (group.html) {
      getGroupDocument(group.id).then(html => setGroupDoc(html))
    }
  }, [])

  useEffect(() => {
    if (groupDoc) {
      hljs.highlightAll()
    }
  }, [groupDoc]);

  const onOpen = (open, id) => {
    if (open) {
      setOpenedDocs(new Set([...openedDocs, id]))
    } else {
      openedDocs.delete(id)
      setOpenedDocs(new Set(openedDocs))
    }
  }

  return (
    <>
      {
        group.html
          ? groupDoc
            ? <TypographyStylesProvider p={0} fz={"sm"}>
              <div dangerouslySetInnerHTML={{ __html: groupDoc }} />
            </TypographyStylesProvider>
            : <LoadingOverlay visible={true} /> // loading
          : null
      }

      <Box pos={"relative"}>
        {
          group.documents.map((doc, j) => {
            const id = doc.id
            const opened = openedDocs.has(id)
            return (
              <NavLink rightSection={<IconChevronRight size="0.8rem" stroke={1.5} />} opened={opened} onClick={() => onOpen(!opened, id)} onChange={o => onOpen(o, id)} childrenOffset={0} key={j} label={<Text size={"sm"} fw={500}>{doc.title}</Text>}>
                {opened ? <DocItem doc={doc} group={group} /> : null}
              </NavLink>
            )
          })
        }
      </Box>
    </>
  )
}

const ReferenceDocs = () => {
  const [expandedGroup, setExpandedGroup] = useState([])
  const expandedSet = useMemo(() => {
    return new Set(expandedGroup)
  }, [expandedGroup])

  return (
    <Accordion chevronPosition="left" multiple={true} value={expandedGroup} onChange={setExpandedGroup} >
      {referenceManifest.map((group, i) => {
        return (
          <Accordion.Item value={group.id} key={i}>
            <Accordion.Control ><Text fw={500}>{group.title}</Text></Accordion.Control>
            <Accordion.Panel pos={"relative"}>
              {
                expandedSet.has(group.id)
                  ? <GroupItem
                    group={group}
                    key={i}
                  />
                  : null
              }
            </Accordion.Panel>
          </Accordion.Item>
        )
      })}
    </Accordion>
  )
}

export const ReferencePanel = () => {
  useEffect(() => {
    hljs.registerLanguage(CycloneLanguageId, hljsCyclone)
  }, []);

  return (
    <Stack>
      <Text c={"dimmed"} size={"sm"}>Here are some quick reference of the language's builtin features. For full documents, please see <Anchor href={"https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html"} target={"_blank"}>language documentation.</Anchor></Text>
      <ReferenceDocs />
    </Stack>
  )
}