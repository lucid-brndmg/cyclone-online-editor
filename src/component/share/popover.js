import {Button, CopyButton, Popover, Stack, TextInput, Text, Textarea} from "@mantine/core";
import {useEditorStore} from "@/state/editorStore";
import lzString from "lz-string"
import {useEffect, useState} from "react";
import {IconCopy} from "@tabler/icons-react";
import {useDebouncedValue} from "@mantine/hooks";
import {PublicUrl} from "@/core/utils/resource";

const ShareUrlPanel = () => {
  const {code} = useEditorStore()
  const [params, setParams] = useState({title: "", author: ""})
  const [debouncedParams] = useDebouncedValue(params, 200)
  const [url, setUrl] = useState("")
  const isInvalid = code.trim().length === 0
  useEffect(() => {
    if (isInvalid) {
      setUrl("")
    } else {
      const query = lzString.compressToEncodedURIComponent(JSON.stringify({
        code,
        ...params,
        date: new Date().toISOString()
      }))
      setUrl(`${location.origin}${PublicUrl.Home}share/${query}`)
    }
  }, [code, debouncedParams]);
  return  (
    <>
      <TextInput
        label={"Title"}
        value={params.title}
        placeholder={"Optional title"}
        onChange={e => setParams({...params, title: e.currentTarget.value})}
        disabled={isInvalid}
      />
      <TextInput
        label={"Author"}
        value={params.author}
        placeholder={"Optional author"}
        onChange={e => setParams({...params, author: e.currentTarget.value})}
        disabled={isInvalid}
      />
      <Textarea
        label={"URL"}
        value={`${url}`}
        placeholder={"Code something to share ..."}
        readOnly
        rows={4}
      />
      <CopyButton value={url}>
        {({ copied, copy }) => (
          <Button variant={"default"} disabled={isInvalid} leftSection={<IconCopy size={14} />} onClick={copy}>
            {copied ? 'Copied' : 'Copy URL'}
          </Button>
        )}
      </CopyButton>
      <Text size={"sm"} c={"dimmed"}>
        This URL could be sent to others to let others read or load your code into the editor.
        <br/><br/>
        However, this URL is only for sharing existing code <b>without changes</b>.
        If the shared code being modified by you or the others,
        the original URL would not be changed and a new url would be generated.
      </Text>
    </>
  )
}

export const SharePopover = ({children, opened, onChange}) => {
  return (
    <Popover width={500} opened={opened} onChange={onChange} trapFocus position="bottom" withArrow shadow="md">
      <Popover.Target
        children={children}
      />
      <Popover.Dropdown>
        <Stack>
          {opened ? <ShareUrlPanel /> : null}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}