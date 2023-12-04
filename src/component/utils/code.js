import {Box, Button, Code, CopyButton, Group} from "@mantine/core";
import {IconCopy, IconDownload} from "@tabler/icons-react";
import {downloadTextFile} from "@/lib/dom";

export const CopyableCodeBlock = ({code, wrap = false, filename, ...props}) => {
  return (
    <Box pos={"relative"} {...props}>
      <Group justify={"right"} mb={"sm"} pos={"absolute"} style={{top: 8, right: 4}}>
        <CopyButton value={code}>
          {({ copied, copy }) => (
            <Button size={"compact-sm"} variant={"default"} leftSection={<IconCopy size={14} />} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </CopyButton>
        <Button size={"compact-sm"} variant={"default"} rightSection={<IconDownload size={14} />} onClick={() => downloadTextFile(code, filename)}>Download</Button>
      </Group>
      <Code style={{whiteSpace: wrap ? "pre-wrap" : undefined}} block={true}>
        {code}
      </Code>
    </Box>
  )
}