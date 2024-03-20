import {
  Box,
  Button,
  CopyButton,
  Group,
  ScrollArea,
  Stack,
  Text, Title,
  Tooltip,
  TypographyStylesProvider
} from "@mantine/core";
import {IconCopy, IconPencil, IconPlayerPlayFilled} from "@tabler/icons-react";
import localforage from "localforage";
import {useRouter} from "next/router";
import {HighlightedCycloneCode} from "@/component/utils/code";
import {PublicUrl} from "@/core/utils/resource";

export const SharedCodePreview = ({shared}) => {
  const {date, title, author, code} = shared
  const router = useRouter()
  const onTry = async () => {
    await localforage.setItem("tmp_code", code)
    await router.push(PublicUrl.Editor)
  }
  return (
    <Stack>
      <Title order={1}>{title || "Cyclone Code"}</Title>
      <Box>
        {author && <Text size={"sm"} c={"dimmed"}>Author: {author}</Text>}
        <Text size={"sm"} c={"dimmed"}>Date: {new Date(date).toLocaleString()}</Text>
      </Box>
      <Group grow>
        <CopyButton value={code}>
          {({ copied, copy }) => (
            <Button variant={"default"} leftSection={<IconCopy size={16} />} onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </CopyButton>
        <Button onClick={onTry} rightSection={<IconPencil size={16} />}>Open In Editor</Button>
      </Group>
      <ScrollArea.Autosize h={`70svh`}>
        <TypographyStylesProvider fz={"sm"} p={0}>
          <HighlightedCycloneCode code={code} />
        </TypographyStylesProvider>
      </ScrollArea.Autosize>
    </Stack>
  )
}