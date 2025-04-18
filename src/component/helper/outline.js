import {
  ActionIcon, Badge,
  Box,
  Center,
  Group, NavLink,
  rem,
  SegmentedControl,
  Stack,
  Text, TextInput
} from "@mantine/core";
import {
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
  IconArrowNarrowRight,
  IconArrowsHorizontal,
  IconBraces,
  IconBug,
  IconCheckbox,
  IconChevronRight,
  IconGolf,
  IconLetterC,
  IconLetterG,
  IconLetterP,
  IconLetterR,
  IconLetterV,
  IconMathFunction,
  IconPlaystationCircle,
  IconRouteX,
  IconSearch,
  IconSettings,
  IconTopologyRing3,
  IconVariable,
  IconVariableMinus,
  IconVector,
  IconViewfinder
} from "@tabler/icons-react";
import {memo, useCallback, useMemo, useState} from "react";
import {useEditorStore} from "@/state/editorStore";
import {useEditorHelperStore} from "@/state/editorHelperStore";
import {eliminateVarGroup, filterText} from "@/core/utils/outline";
import {
    formatErrorMessage, formatErrorSource,
} from "@/core/utils/format";
import {locateToCode} from "@/core/utils/monaco";
import {isInfo, isWarning} from "@/core/specification";
import cycloneAnalyzer from "cyclone-analyzer";
import {useDebouncedValue} from "@mantine/hooks";
import {ErrorSource} from "@/core/definitions";

const {IdentifierKind, SemanticContextType, SyntaxBlockKind} = cycloneAnalyzer.language.definitions
const {typeToString} = cycloneAnalyzer.utils.type

const syntaxBlockIcons = {
  [SyntaxBlockKind.CompilerOption]: IconSettings,
  [SyntaxBlockKind.Machine]: IconVector,
  [SyntaxBlockKind.State]: IconPlaystationCircle,
  [SyntaxBlockKind.Assertion]: IconCheckbox,
  [SyntaxBlockKind.Variable]: null,
  [SyntaxBlockKind.Func]: IconMathFunction,
  [SyntaxBlockKind.Goal]: IconViewfinder,
  [SyntaxBlockKind.Invariant]: IconVariableMinus,
  [SyntaxBlockKind.PathVariable]: IconLetterP,
  [SyntaxBlockKind.PathStatement]: IconRouteX,
  [SyntaxBlockKind.Record]: IconBraces,
  [SyntaxBlockKind.GoalFinal]: IconGolf
}

const SmallGroup = ({children, ...props}) => {
  return <Group gap={8} {...props}>
    {children}
  </Group>
}

const IdentifierText = ({identifier, fallback, isSearched}) => {
  return <Text c={isSearched ? "red" : identifier ? undefined : "dimmed"}>{identifier ?? fallback}</Text>
}

const OUTLINE_COLOR = "blue"

const getSyntaxBlockStyle = block => {
  let children = null, text = null, Icon = null// , displayPosition = true

  switch (block.kind) {
    case SyntaxBlockKind.CompilerOption: {
      text = (
        <SmallGroup>
          <Text fs={"italic"} c={OUTLINE_COLOR}>option-</Text>
          <IdentifierText identifier={block.data.name} isSearched={block.isSearched} />
        </SmallGroup>
      )
      break
    }
    case SyntaxBlockKind.Machine: {
      children = block.children
      text = (
        <SmallGroup>
          <Text fs={"italic"} c={OUTLINE_COLOR}>{block.data.keyword}</Text>
          {/* <Text>{}</Text> */}
          <IdentifierText identifier={block.data.identifier} isSearched={block.isSearched} />
        </SmallGroup>
      )
      break
    }
    case SyntaxBlockKind.State: {
      text = (
        <SmallGroup>
          <Text fs={"italic"} c={OUTLINE_COLOR}>{block.data.attributes?.join(" ") ?? "node"}</Text>
          <IdentifierText identifier={block.data.identifier} isSearched={block.isSearched} />

        </SmallGroup>
      )
      break
    }
    case SyntaxBlockKind.Transition: {
      const {identifier, operators} = block.data
      text = (
        <SmallGroup>
          <Text fs={"italic"} c={OUTLINE_COLOR}>{block.data.keyword}</Text>
          {/* <Text c={identifier ? undefined : "dimmed"}>{identifier ?? "anonymous"}</Text> */}
          {identifier
            ? <IdentifierText identifier={identifier} isSearched={block.isSearched} />
            : null
          }

        </SmallGroup>
      )
      Icon = operators.has("->")
        ? IconArrowNarrowRight
        : IconArrowsHorizontal
      break
    }
    case SyntaxBlockKind.Assertion: {
      text = (
        <Text fs={"italic"} c={OUTLINE_COLOR}>assert</Text>
      )
      break
    }

    case SyntaxBlockKind.Variable: {
      const {
        identifier, type, kind, typeParams
      } = block.data

      switch (kind) {
        case IdentifierKind.GlobalConst:
          text = (
            <SmallGroup>
              <Text fs={"italic"} c={OUTLINE_COLOR}>const {typeToString(type, typeParams)}</Text>
              <IdentifierText identifier={`${identifier}`} isSearched={block.isSearched} />
            </SmallGroup>
          )
          Icon = IconLetterC
          break
        case IdentifierKind.FnParam:
          text = (
            <SmallGroup>
              <IdentifierText identifier={`${identifier}:`} isSearched={block.isSearched} />
              <Text fs={"italic"} c={OUTLINE_COLOR}>{typeToString(type, typeParams)}</Text>
            </SmallGroup>
          )
          Icon = IconVariable // IconLetterP
          break
        case IdentifierKind.RecordField:
          Icon = IconLetterR
          break
        case IdentifierKind.GlobalVariable:
          Icon = IconLetterG
          break
        case IdentifierKind.LocalVariable:
          Icon = IconLetterV
          break
      }
      if (!text) {
        text = (
          <SmallGroup>
            <Text fs={"italic"} c={OUTLINE_COLOR}>{typeToString(type, typeParams)}</Text>
            <IdentifierText identifier={identifier} isSearched={block.isSearched} />
          </SmallGroup>
        )
      }
      break
    }

    case SyntaxBlockKind.Func: {
      children = block.children.filter(ch => ch.kind === SyntaxBlockKind.Variable)
      text = (
        <SmallGroup>
          <Text fs={"italic"} c={OUTLINE_COLOR}>function</Text>
          <IdentifierText identifier={`${block.data.identifier}:`} isSearched={block.isSearched} />
          <Text fs={"italic"} c={OUTLINE_COLOR}>{typeToString(block.data.returnType, block.data.returnTypeParams)}</Text>
        </SmallGroup>
      )
      break
    }
    case SyntaxBlockKind.Goal: {
      children = block.children
      text = (
        <Text fs={"italic"} c={OUTLINE_COLOR}>
          goal
        </Text>
      )
      break
    }

    case SyntaxBlockKind.Invariant: {
      text = (
        <SmallGroup>
          <Text fs={"italic"} c={OUTLINE_COLOR}>invariant</Text>
          <IdentifierText identifier={block.data.identifier} isSearched={block.isSearched} />
        </SmallGroup>
      )
      break
    }

    case SyntaxBlockKind.PathVariable: {
      text = (
        <SmallGroup>
          <Text fs={"italic"} c={OUTLINE_COLOR}>let</Text>
          <IdentifierText identifier={block.data.identifier} isSearched={block.isSearched} />
        </SmallGroup>
      )
      break
    }
    case SyntaxBlockKind.PathStatement: {
      const {code} = block.data

      text = (
        <Text>{code.split("=", 1)}= ...</Text>
      )
      break
    }
    case SyntaxBlockKind.Record: {
      children = block.children
      text = (
        <SmallGroup>
          <Text fs={"italic"} c={OUTLINE_COLOR}>record</Text>
          <IdentifierText identifier={block.data.identifier} isSearched={block.isSearched} />
        </SmallGroup>
      )
      break
    }
    case SyntaxBlockKind.GoalFinal: {
      const {checkKeyword, forKeyword} = block.data

      text = (
        <SmallGroup>
          <Text fs={"italic"} c={OUTLINE_COLOR}>{checkKeyword}</Text>
          <Text fs={"italic"} c={OUTLINE_COLOR}>{forKeyword}</Text>
        </SmallGroup>
      )
      break
    }

    case SyntaxBlockKind.Program: {
      children = block.children
      break
    }
  }

  if (!Icon) {
    Icon = syntaxBlockIcons[block.kind]
  }

  return {
    children,
    text,
    Icon
  }
}

const StructureNode = ({node, depth = 1, onJump}) => {
  const {text, Icon, children} = getSyntaxBlockStyle(node)
  const hasChildren = !!children?.length
  const [opened, setOpened] = useState(true)
  const jump = () => {
    if (node.position) {
      onJump(node.position.startPosition)
    }
  }
  const childrenMapper = (block) => (<StructureNode key={block.id} node={block} depth={depth + 1} onJump={onJump} />)
  return text
    ? (
      <NavLink
        // style={{height: "36px"}}
        label={
          <Group justify={"space-between"}>
            {text}
            {/* <Group> */}
            {/*   /!* <Text size={"xs"} c={"dimmed"}>{formatKindDescription(node.kind)}</Text> *!/ */}
            {/*   <Text size={"xs"} c={"dimmed"} px={"sm"}>{node.position.startPosition.line}:{node.position.startPosition.column + 1}</Text> */}
            {/* </Group> */}
            <Text size={"xs"} c={"dimmed"} px={"sm"}>{node.position.startPosition.line}:{node.position.startPosition.column + 1}</Text>
          </Group>
        }
        childrenOffset={8 * depth}
        leftSection={<Icon size={14} />}
        onClick={jump}
        rightSection={hasChildren ? <ActionIcon onClick={e => {
          e.stopPropagation()
          setOpened(!opened)
        }} variant={"subtle"} color={"dark"} radius={"xl"}><IconChevronRight size={16} stroke={1.5} /></ActionIcon> : null}
        opened={opened}
      >
        {
          hasChildren
            ? children.map(childrenMapper)
            : null
        }
      </NavLink>
    )
    : children ? (
      <Box>
        {children.map(childrenMapper)}
      </Box>
    ) : null
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
  // const {structureOutline} = useEditorHelperStore()
  const {monacoCtx, editorCtx} = useEditorStore()
  // const idle = useIdle(2000, { events: ['keypress'] });
  const onJump = useCallback(({line, column}) => {
    // monacoCtx?.editor.setPosition({lineNumber: line, column: column + 1})
    // monacoCtx?.editor.revealPosition({ lineNumber: line, column: column + 1 });
    // monacoCtx?.editor.focus()

    if (monacoCtx?.editor) {
      locateToCode(monacoCtx.editor, {line, column: column + 1})
    }
  }, [monacoCtx])

  const [keyword, setKeyword] = useState("")
  const [debouncedKeyword] = useDebouncedValue(keyword, 200)

  const [count, tree, searched] = useMemo(() => {
    const program = editorCtx?.getProgramBlock()
    const trimmedKeyword = debouncedKeyword.trim().toLowerCase()

    if (program) {
      const programOutline = eliminateVarGroup(program, null)
      if (trimmedKeyword) {
        const blockFinder = (block) => {
          const data = block.data
          if (!data) {
            return false
          }
          const {
            identifier, name,
            // fromState, toStates, excludedStates
          } = data
          return (identifier && identifier.toLowerCase().includes(trimmedKeyword))
            || (name && name.includes(trimmedKeyword))
            // || (enums?.length && enums.some(enumVal => enumVal.toLowerCase().includes(trimmedKeyword)))
          // || (fromState && fromState.toLowerCase().includes(debouncedKeyword))
          // || (toStates?.length && toStates.some(s => s.toLowerCase().includes(debouncedKeyword)))
          // || excludedStates?.length && excludedStates.some(s => s.toLowerCase().includes(debouncedKeyword))
        }
        const {count, result} = filterText(programOutline, blockFinder)
        return [count, result, true]
      } else {
        return [0, programOutline, false]
      }
    }
    return [0, null, false]

    // return program
    //   ? prefix
    //     ? filterText(structureOutline.children[0], prefix)
    //     : structureOutline.children[0]
    //   : null
  }, [editorCtx, debouncedKeyword])
  const searchResult = searched && count
    ? `Found ${count} identifiers. `
    : searched
      ? "No results found. "
      : ""

  return (
    tree
      ? <>
        <TextInput
          label={"Search identifier"}
          placeholder={"Enter Keyword ..."}
          value={keyword}
          onChange={e => setKeyword(e.currentTarget.value)}
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
  let icon, text = formatErrorSource(e.source)
  if (isWarning(e.type)) {
    if (e.source === ErrorSource.Semantic) {
      text = "Semantic Warning"
    }
    icon = <Box c={"orange"}><IconAlertTriangleFilled size={24} /></Box>
  } else if (isInfo(e.type)) {
    if (e.source === ErrorSource.Semantic) {
      text = "Semantic Problem"
    }
    icon = <Box c={"blue"}><IconAlertCircleFilled size={24} /></Box>
  } else {
    if (e.source === ErrorSource.Semantic) {
      text = "Semantic Error"
    }
    icon = <Box c={"red"}><IconAlertCircleFilled size={24} /></Box>
  }

  return {
    icon,
    text: <Box>
       <Group justify={"space-between"}>
         <Text size={"sm"} fw={500}>
           {text}
         </Text>
         <Text size={"sm"} c={"dimmed"} px={"sm"}>{e.startPosition.line}:{e.startPosition.column + 1}</Text>
       </Group>
       <Text size={"sm"}>
         {formatErrorMessage(e.type, e.params)}
       </Text>

        {/*<Group justify={"space-between"}>*/}
        {/*    <Text size={"sm"}>*/}
        {/*        {formatErrorMessage(e.type, e.params)}*/}
        {/*    </Text>*/}
        {/*    <Text size={"sm"} c={"dimmed"} px={"sm"}>{e.startPosition.line}:{e.startPosition.column + 1}</Text>*/}
        {/*</Group>*/}

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
  const {errors} = useEditorStore()

  // const [panel, onPanel] = useState("structure")
  const {outlineTab, setOutlineTab} = useEditorHelperStore()
  const Component = panels[outlineTab]
  const errorSize = errors.length

  // useEffect(() => {
  //   // if (editorCtx) {
  //   //   // console.log(scopeLayersToOutline(editorCtx.getScopeLayers()))
  //   //   setStructureOutline(scopeLayersToOutline(editorCtx.getScopeLayers()))
  //   // } else {
  //   //   setStructureOutline(null)
  //   // }
  // }, [editorCtx])

  return (
    <Stack>
      <SegmentedControl value={outlineTab} onChange={setOutlineTab} data={[
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