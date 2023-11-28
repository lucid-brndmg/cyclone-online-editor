import {Box, Button, CopyButton, Group, Tooltip} from "@mantine/core";
import {IconCopy, IconPlayerPlayFilled} from "@tabler/icons-react";
import {useEditorStore} from "@/state/editorStore";
import {locateToCode} from "@/core/utils/monaco";

export const ExecutableCode = ({children, execCode, onTry}) => {
  // const {setCode} = useEditorStore()
  //
  // const onTryBtn = () => {
  //   setCode(execCode)
  // }

  return (
    <Box pos={"relative"}>
      <Group justify={"right"} mb={"sm"} pos={"absolute"} style={{top: 4, right: 4}}>
        <CopyButton value={execCode}>
          {({ copied, copy }) => (
            <Button size={"compact-sm"} variant={"default"} leftSection={<IconCopy size={14} />} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </CopyButton>
        <Tooltip label={"Click 'run' to see results"}>
          <Button size={"compact-sm"} rightSection={<IconPlayerPlayFilled size={14} />} onClick={onTry}>Try</Button>
        </Tooltip>
      </Group>
      {children}
    </Box>
  )
}