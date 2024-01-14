import {
  ActionIcon, Badge,
  Box,
  Center,
  Divider, Group, Indicator,
  NavLink,
  rem,
  SegmentedControl,
  Space,
  Stack,
  Text, TextInput
} from "@mantine/core";
import {
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
  IconArrowRightCircle,
  IconBook2,
  IconBraces,
  IconBug,
  IconChartCircles,
  IconChevronRight,
  IconCircleDot, IconCircleLetterC, IconCircleLetterE, IconCircleLetterG,
  IconCircleLetterI, IconCircleLetterP, IconCircleLetterR, IconCircleLetterV,
  IconCircleX,
  IconFolder, IconLetterC, IconLetterE, IconLetterG, IconLetterI, IconLetterP, IconLetterR, IconLetterV,
  IconListTree,
  IconMathFunction,
  IconPlaystationCircle, IconRoute2,
  IconSearch,
  IconTopologyRing3,
  IconVariableMinus,
  IconVector,
  IconViewfinder
} from "@tabler/icons-react";
import {memo, useCallback, useEffect, useMemo, useState} from "react";
import {useEditorStore} from "@/state/editorStore";
import {useEditorHelperStore} from "@/state/editorHelperStore";
import {filterText, scopeLayersToOutline} from "@/core/utils/outline";
import {IdentifierKind, IdentifierType, OutlineKind, SemanticContextType} from "@/core/definitions";
import {
  formatErrorDescription, formatErrorMessage,
  formatKindDescription,
  formatScopeBlockType,
  formatType
} from "@/core/utils/format";
import {locateToCode} from "@/core/utils/monaco";
import {useIdle} from "@mantine/hooks";
import {isWarning} from "@/core/specification";

const outlineBlockTypeIcons = {
  [SemanticContextType.MachineScope]: IconVector,
  [SemanticContextType.StateScope]: IconPlaystationCircle,
  [SemanticContextType.TransScope]: IconArrowRightCircle,
  [SemanticContextType.GoalScope]: IconViewfinder,
  [SemanticContextType.RecordScope]: IconBraces,
  [SemanticContextType.EnumDecl]: IconBraces,
  [SemanticContextType.FnBodyScope]: IconMathFunction,
  [SemanticContextType.InvariantScope]: IconVariableMinus,
}

const outlineIdentKindIcons = {
  [IdentifierKind.FnParam]: IconLetterP,
  [IdentifierKind.Let]: IconRoute2,
  [IdentifierKind.EnumField]: IconLetterE,
  [IdentifierKind.GlobalVariable]: IconLetterG,
  [IdentifierKind.GlobalConst]: IconLetterC,
  [IdentifierKind.RecordField]: IconLetterR,
  [IdentifierKind.LocalVariable]: IconLetterV,
}

const getOutlineNodeStyle = node => {
  switch (node.outlineKind) {
    case OutlineKind.Scope: {
      const Icon = outlineBlockTypeIcons[node.type] ?? IconBraces

      return {
        text: <Group justify={"space-between"}>
          <Text>
            <Text c={"blue"} span>{formatScopeBlockType(node.type)}</Text>
            {' '}
            <Text span>{node.text || ""}</Text>
          </Text>
          <Text size={"xs"} c={"dimmed"} px={"sm"}>{node.position.startPosition.line} :{node.position.startPosition.column + 1}</Text>
        </Group>, // `${formatScopeBlockType(node.type)} ${node.text || ""}`,
        icon: <Icon size={12} />
      }
    }

    case OutlineKind.Identifier: {
      const Icon = outlineIdentKindIcons[node.kind] ?? IconLetterI

      return {
        text: <Group justify={"space-between"}>
          <Text>
            <Text c={"purple"} span>{node.kind === IdentifierKind.FnParam ? "param" : formatType(node.type)}</Text>
            {' '}
            {node.text}
          </Text>

          <Group>
            <Text size={"xs"} c={"dimmed"}>{formatKindDescription(node.kind)}</Text>
            <Text size={"xs"} c={"dimmed"} px={"sm"}>{node.position.startPosition.line}:{node.position.startPosition.column + 1}</Text>
          </Group>

        </Group>,
        icon: <Icon size={12} />
      }
    }
  }
}

const StructureNode = ({node, depth = 1, onJump}) => {
  const {text, icon} = getOutlineNodeStyle(node)
  const hasChildren = !!node?.children?.length
  const [opened, setOpened] = useState(true)
  const onClick = () => {
    if (node.position) {
      onJump(node.position.startPosition)
    }
  }
  return (
    <NavLink
      // style={{height: "36px"}}
      label={text}
      childrenOffset={16 * depth}
      leftSection={icon}
      onClick={onClick}
      rightSection={hasChildren ? <ActionIcon onClick={e => {
        e.stopPropagation()
        setOpened(!opened)
      }} variant={"subtle"} color={"dark"} radius={"xl"}><IconChevronRight size={16} stroke={1.5} /></ActionIcon> : null}
      opened={opened}
    >
      {
        hasChildren
          ? node.children.map((layer, i) => <StructureNode key={i} node={layer} depth={depth + 1} onJump={onJump} />)
          : null
      }
    </NavLink>
  )
}

const MemoStructureNode = memo(function MemoStructureNode({node, onJump}) {
  return (
    <StructureNode node={node} depth={1} onJump={onJump} />
  )
}, arePropsEqual)
function arePropsEqual(oldProps, newProps) {
  return oldProps.node === newProps.node
}

const StructureOutlineTree = () => {
  const {structureOutline} = useEditorHelperStore()
  const {monacoCtx} = useEditorStore()
  // const idle = useIdle(2000, { events: ['keypress'] });
  const onJump = useCallback(({line, column}) => {
    // monacoCtx?.editor.setPosition({lineNumber: line, column: column + 1})
    // monacoCtx?.editor.revealPosition({ lineNumber: line, column: column + 1 });
    // monacoCtx?.editor.focus()

    if (monacoCtx?.editor) {
      locateToCode(monacoCtx.editor, {line, column: column + 1})
    }
  }, [monacoCtx])

  const [prefix, setPrefix] = useState("")
  const tree = useMemo(() => {

    return structureOutline
      ? prefix
        ? filterText(structureOutline.children[0], prefix)
        : structureOutline.children[0]
      : null
  }, [structureOutline, prefix])
  const searchResult = tree?.count
    ? `Found ${tree.count} identifiers. `
    : prefix
      ? "No results found. "
      : ""

  return (
    tree
      ? <>
        <TextInput
          label={"Search identifier by prefix"}
          placeholder={"Enter Keyword ..."}
          value={prefix}
          onChange={e => setPrefix(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
        />
        <Text c={"dimmed"} size={"xs"}>{searchResult}Click to jump</Text>
        <MemoStructureNode node={tree} onJump={onJump} />
      </>
      : <Text c={"dimmed"} size={"sm"}>
        No structure outline available, try to type some code & fix syntax errors first
      </Text>
  )
}

const getErrorStyle = e => {
  let icon
  if (isWarning(e.type)) {
    icon = <Box c={"orange"}><IconAlertTriangleFilled size={24} /></Box>
  } else {
    icon = <Box c={"red"}><IconAlertCircleFilled size={24} /></Box>
  }

  return {
    icon,
    text: <Box>
      <Group justify={"space-between"}>
        <Text size={"sm"} fw={500}>
          {formatErrorDescription(e.type)}
        </Text>
        <Text size={"sm"} c={"dimmed"} px={"sm"}>{e.startPosition.line}:{e.startPosition.column + 1}</Text>
      </Group>
      <Text size={"sm"}>
        {formatErrorMessage(e.type, e.params)}
      </Text>
    </Box>
  }
}

const ProblemsPanel = () => {
  const {errors, monacoCtx} = useEditorStore()
  const totalErrors = errors.length

  const onJump = e => {
    if (monacoCtx?.editor) {
      locateToCode(monacoCtx.editor, {line: e.startPosition.line, column: e.startPosition.column + 1})
    }
  }

  return (
    totalErrors
      ? errors.map((e, i) => {
        const {icon, text} = getErrorStyle(e)
        return (
          <NavLink
            key={i}
            leftSection={icon}
            label={text}
            onClick={() => onJump(e)}
            // style={{height: "36px"}}

          />
        )
      })
      : <Text c={"dimmed"} size={"sm"}>
      No problems detected
    </Text>
  )
}

const panels = {
  "structure": StructureOutlineTree,
  "problems": ProblemsPanel
}

export const OutlinePanel = () => {
  const {editorCtx, errors} = useEditorStore()
  const {setStructureOutline} = useEditorHelperStore()

  const [panel, onPanel] = useState("structure")
  const Component = panels[panel]
  const errorSize = errors.length

  useEffect(() => {
    if (editorCtx) {
      // console.log(scopeLayersToOutline(editorCtx.getScopeLayers()))
      setStructureOutline(scopeLayersToOutline(editorCtx.getScopeLayers()))
    } else {
      setStructureOutline(null)
    }
  }, [editorCtx])

  return (
    <Stack>
      <SegmentedControl value={panel} onChange={onPanel} data={[
        {
          value: 'structure',
          label: (
            <Center>
              <IconTopologyRing3 style={{ width: rem(16), height: rem(16) }} />
              <Box ml={10}>Structure</Box>
            </Center>
          ),
        },
        {
          value: 'problems',
          label: (
            <Center>
              <IconBug style={{ width: rem(16), height: rem(16) }} />
              <Group ml={10} gap={"xs"}>
                <Box>Problems</Box>
                <Badge style={{display: errorSize ? "" : "none"}} size="sm" variant="filled" color="red" p={4} h={16} w={16}>
                  {errorSize}
                </Badge>
              </Group>

            </Center>
          ),
        },
      ]} />

      <Component />

    </Stack>
  )
}