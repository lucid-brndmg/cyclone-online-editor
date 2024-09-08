import referenceManifest from "../../../resource/reference_manifest.json"
import {
  Accordion,
  Anchor,
  Box,
  LoadingOverlay,
  NavLink,
  Stack,
  Text, TextInput,
  TypographyStylesProvider
} from "@mantine/core";
import {IconChevronRight, IconCircleFilled} from "@tabler/icons-react";
import {useCallback, useEffect, useMemo, useState} from "react";
import {getDocumentById, getGroupDocument} from "@/core/resources/referenceDocs";
import {useDebouncedValue} from "@mantine/hooks";
import parse from "html-react-parser";
import {htmlCodeUrlReplacer} from "@/component/utils/code";

const DocItem = ({group, doc}) => {
  const [docContent, setDocContent] = useState(null)

  useEffect(() => {
    getDocumentById(group.id, doc.id).then(html => {
      // parse(html, htmlCodeUrlReplacer())
      setDocContent(html)
    })
  }, [])

  const parsed = useMemo(() => {
    if (docContent) {
      const parsed = parse(docContent, htmlCodeUrlReplacer())
      return parsed
    }

    return null
  }, [docContent])
  
  return (
    <TypographyStylesProvider className={"docItem"} mt={"sm"} mb={"sm"} p={0} fz={"sm"} pos={"relative"}>
      {/* <LoadingOverlay visible={parsed == null} /> */}
      {/* <div dangerouslySetInnerHTML={{ __html: docContent ?? '??' }} /> */}
      {parsed ?? "loading"}
    </TypographyStylesProvider>
  )
}

const GroupItem = ({group}) => {
  const [groupDoc, setGroupDoc] = useState(null)
  const [openedDocs, setOpenedDocs] = useState(new Set())
  // const [search, setSearch] = useState("")
  // const [debouncedSearch] = useDebouncedValue(search, 200)

  useEffect(() => {
    if (group.html) {
      getGroupDocument(group.id).then(html => setGroupDoc(html))
    }
  }, [])

  const parsed = useMemo(() => {
    if (groupDoc) {
      return parse(groupDoc, htmlCodeUrlReplacer())
    }

    return null
  }, [groupDoc])

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
          ? <TypographyStylesProvider p={0} fz={"sm"}>
            <LoadingOverlay visible={parsed == null} />
            {parsed}
            {/* <div dangerouslySetInnerHTML={{ __html: groupDoc }} /> */}
          </TypographyStylesProvider>
          : null
      }

      <Box pos={"relative"}>
        {
          group.documents.map((doc, j) => {
            const id = doc.id
            const opened = openedDocs.has(id)
            return (
              <NavLink
                variant={"filled"}
                active={opened}
                leftSection={<Box style={{display: "flex", alignItems: "baseline"}} c={opened ? undefined : "blue"}>{<IconCircleFilled size={14} />}</Box>}
                rightSection={<IconChevronRight size="0.8rem" stroke={1.5} />}
                opened={opened}
                onClick={() => onOpen(!opened, id)} onChange={o => onOpen(o, id)}
                childrenOffset={0}
                key={j}
                label={<Text c={opened ? undefined : "blue"} size={"sm"} fw={500}>{doc.title}</Text>}
              >
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
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebouncedValue(search, 200)

  const filterSearchGroup = useCallback(group => {
    const low = debouncedSearch.toLowerCase().trim()
    return group.title.toLowerCase().includes(low)
      || group.documents.some(doc => doc.title.toLowerCase().includes(low))
  }, [debouncedSearch])

  return (
    <>
      <TextInput
        value={search}
        onChange={e => setSearch(e.currentTarget.value)}
        label={"Quick Search"}
      />
      <Accordion chevronPosition="left" multiple={true} value={expandedGroup} onChange={setExpandedGroup} >
        {(debouncedSearch ? referenceManifest.filter(filterSearchGroup) : referenceManifest).map((group, i) => {
          return (
            <Accordion.Item value={group.id} key={i}>
              <Accordion.Control ><Text fw={500}>{group.title}</Text></Accordion.Control>
              <Accordion.Panel pos={"relative"}>
                {
                  expandedSet.has(group.id)
                    ? <GroupItem
                      group={group}
                      key={i}
                      // search={debouncedSearch}
                    />
                    : null
                }
              </Accordion.Panel>
            </Accordion.Item>
          )
        })}
      </Accordion>
    </>
  )
}

export const ReferencePanel = () => {
  return (
    <Stack>
      <Text c={"dimmed"} size={"sm"}>Here are some quick reference of the language's builtin features. For full documents, please see <Anchor href={"https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html"} target={"_blank"}>language documentation.</Anchor></Text>
      <ReferenceDocs />
    </Stack>
  )
}