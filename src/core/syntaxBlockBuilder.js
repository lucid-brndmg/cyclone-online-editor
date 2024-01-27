import {IdentifierKind, IdentifierType, SemanticContextType, SyntaxBlockKind} from "@/core/definitions";
import {getExpression} from "@/core/utils/antlr";
import {CategorizedStackTable, StackedTable} from "@/lib/storage";
import {syntaxBlockIdPrefix} from "@/core/specification";

const idPrefixKind = (() => {
  const result = {}
  Object.entries(syntaxBlockIdPrefix).forEach(([kind, pref]) => {
    result[pref] = parseInt(kind)
  })
  return result
})()

const buildId = (kind, numId) => {
  return `${syntaxBlockIdPrefix[kind]}:${numId}`
}

const idToKind = id => {
  return idPrefixKind[id.split(":")[0]]
}

const semanticTypePathToBlockKind = path => {
  for (let i = path.length - 1; i >= 0 ; i--) {
    const blockType = path[i - 1]
    switch (blockType) {
      case SemanticContextType.MachineDecl: return SyntaxBlockKind.Machine
      case SemanticContextType.StateDecl: return SyntaxBlockKind.State
      case SemanticContextType.TransDecl: return SyntaxBlockKind.Transition
      case SemanticContextType.InvariantDecl: return SyntaxBlockKind.Invariant
      case SemanticContextType.GoalScope: return SyntaxBlockKind.Goal
      case SemanticContextType.LetDecl: return SyntaxBlockKind.PathVariable
      case SemanticContextType.RecordDecl: return SyntaxBlockKind.Record
      case SemanticContextType.VariableDecl: return SyntaxBlockKind.Variable

      case SemanticContextType.RecordVariableDeclGroup:
      case SemanticContextType.GlobalVariableGroup:
      case SemanticContextType.LocalVariableGroup:
      case SemanticContextType.GlobalConstantGroup: return SyntaxBlockKind.SingleTypedVariableGroup

      case SemanticContextType.FnDecl: return SyntaxBlockKind.Func
      case SemanticContextType.FnParamsDecl: return SyntaxBlockKind.FnParamGroup
      case SemanticContextType.AssertExpr: return SyntaxBlockKind.Assertion
      case SemanticContextType.CompilerOption: return SyntaxBlockKind.CompilerOption
      case SemanticContextType.Statement: return SyntaxBlockKind.Statement
      case SemanticContextType.PathAssignStatement: return SyntaxBlockKind.PathStatement
    }
  }

  console.trace("warn: semantic block path can not be converted to syntax block kind")
  return null
}

// "IR-I"
export default class SyntaxBlockBuilder {
  context

  constructor() {
    this.context = {
      blocks: [],
      latestBlocks: new StackedTable(),
      ids: new Map(),
      unsortedError: [],
      idBlocks: new Map(),
      latestBlock: null

      // // id, [block_id]
      // identifierRegistrations: new StackedTable(),
      //
      // // enum_id, [block_id]
      // enumRegistrations: new StackedTable(),

      // childBlocks: new StackedTable(),
      // errorTable: new StackedTable(), // block_id, [error]

    }
  }

  assignId(kind) {
    let id
    if (this.context.ids.has(kind)) {
      id = this.context.ids.get(kind) + 1
    } else {
      id = 0
    }
    this.context.ids.set(kind, id)
    return buildId(kind, id)
  }

  createBlock(kind, position = null, parentId = null, data = null) {
    const id = this.assignId(kind)
    const block = {
      id,
      parentId,
      position,
      errors: [],
      childErrors: [],
      references: new Set(),
      // childReferences: new Set(),
      kind,
      data: data ?? {}
    }
    this.context.blocks.push(block)
    this.context.latestBlocks.push(kind, block)
    this.context.idBlocks.set(id, block)
    this.context.latestBlock = block

    return id
    // if (parentId) {
    //   this.context.childBlocks.push(parentId, block)
    // }
  }

  followBlocks(parentId, acc = []) {
    const block = this.context.idBlocks.get(parentId)
    if (!block) {
      console.trace("warn: no block found by id", parentId)
      return acc
    }

    acc.push(block)

    if (!block.parentId) {
      return acc
    }

    return this.followBlocks(block.parentId, acc)
  }

  createErrors(errors, kind) {
    return errors.map((error) => ({error, syntaxBlockKind: kind, id: this.assignId(SyntaxBlockKind.Error)}))
  }

  markErrors(kind, errors, pushUnsorted = true) {
    let block
    if (kind) {
      block = this.getLatestBlock(kind)
    }
    const createdErrors = this.createErrors(errors, kind)
    if (!block) {
      if (pushUnsorted) {
        this.context.unsortedError.push(createdErrors)
      }
      return false
    }

    block.errors.push(...createdErrors)

    if (!block.parentId) {
      return true
    }

    const blocks = this.followBlocks(block.parentId)
    for (let block of blocks) {
      block.childErrors.push(...createdErrors)
    }
    return true
  }

  markData(kind, data) {
    const block = this.getLatestBlock(kind)
    if (!block) {
      console.log("warn: no block found with data", kind, data)
      return
    }
    block.data = {...block.data, ...data}
  }

  getLatestBlock(kind) {
    return this.context.latestBlocks.peek(kind)
  }

  getLatestBlockId(kind) {
    return this.context.latestBlocks.peek(kind)?.id
  }

  markIdentifier(ident, blockId, scopeId = null) {
    if (!blockId) {
      console.log("warn: block id not found for ident", ident)
      return;
    }
    // for record fields: rec.field
    // for enums: #enum
    const gb = this.getLatestBlock(SyntaxBlockKind.Machine)
    if (!gb) {
      console.log("machine not found for ident", ident, blockId)
      return
    }

    gb.data.identifiers.push(ident, {blockId, scopeId})
  }

  clearIdentifier(scopeId) {
    const gb = this.getLatestBlock(SyntaxBlockKind.Machine)
    if (!gb || !scopeId) {
      console.log("machine or scope id not found for ident", scopeId)
      return
    }
    // for (let ident of idents) {
    //   gb.data.identifiers.filtered(ident, blockKind => !graphicalBlockKinds.includes(blockKind))
    // }
    gb.data.identifiers.filtered(({blockId, scopeId}) => scopeId === scopeId)
  }

  markReference(kind, ident, blockRestrictions = []) {
    const block = this.getLatestBlock(kind)
    const machine = this.getLatestBlock(SyntaxBlockKind.Machine)
    if (!block || !machine) {
      console.log("block or machine not found when marking reference", kind, ident, blockRestrictions)
      return
    }
    const identRegBlockIds = machine.data.identifiers.get(ident)
    if (!identRegBlockIds?.length) {
      return;
    }

    let markId

    if (!blockRestrictions.length) {
      markId = identRegBlockIds[identRegBlockIds.length - 1]?.blockId
    } else {
      for (let i = identRegBlockIds.length - 1; i <= 0; i--) {
        const {blockId} = identRegBlockIds[i]
        if (blockRestrictions.includes(blockId)) {
          markId = blockId
          break
        }
      }
    }

    if (markId) {
      block.references.add(markId)
    }
  }

  #onAnalyzerBlockEnter(context, {block, payload}) {
    const {type, position} = block
    switch (type) {
      case SemanticContextType.CompilerOption: {
        this.createBlock(SyntaxBlockKind.CompilerOption, position)
        break
      }
      case SemanticContextType.MachineDecl: {
        this.createBlock(SyntaxBlockKind.Machine, position, null, {
          identifiers: new StackedTable(),
          recordFields: new CategorizedStackTable()
        })
        break
      }
      case SemanticContextType.GlobalVariableGroup:
      case SemanticContextType.GlobalConstantGroup: {
        this.createBlock(SyntaxBlockKind.SingleTypedVariableGroup, position, this.getLatestBlockId(SyntaxBlockKind.Machine), {
          varKind: type === SemanticContextType.GlobalVariableGroup
            ? IdentifierKind.GlobalVariable
            : IdentifierKind.GlobalConst,
        })
        break
      }

      case SemanticContextType.RecordDecl: {
        this.createBlock(SyntaxBlockKind.Record, position, this.getLatestBlockId(SyntaxBlockKind.Machine), {
          groupKind: IdentifierKind.Record
        })
        break
      }
      case SemanticContextType.RecordVariableDeclGroup: {
        this.createBlock(SyntaxBlockKind.SingleTypedVariableGroup, position, this.getLatestBlockId(SyntaxBlockKind.Record), {
          varKind: IdentifierKind.RecordField
        })
        break
      }
      case SemanticContextType.VariableInit: {
        const codeInit = getExpression(payload)
        this.markData(SyntaxBlockKind.Variable, {
          codeInit
        })
        break
      }
      case SemanticContextType.FnDecl: {
        this.createBlock(SyntaxBlockKind.Func, position, this.getLatestBlockId(SyntaxBlockKind.Machine), {
          statements: [],
          returnType: IdentifierType.Hole,
          identifier: ""
        })
        break
      }
      case SemanticContextType.FnParamsDecl: {
        this.createBlock(SyntaxBlockKind.FnParamGroup, position, this.getLatestBlockId(SyntaxBlockKind.Func))
        break
      }
      case SemanticContextType.Statement: {
        const semBlocks = context.findNearestBlockByTypes([
          SemanticContextType.FnBodyScope,
          SemanticContextType.InvariantScope,
          SemanticContextType.StateScope
        ])

        const content = {
          code: getExpression(payload)
        }

        switch (semBlocks.type) {
          case SemanticContextType.FnBodyScope: {
            this.createBlock(SyntaxBlockKind.Statement, position, this.getLatestBlockId(SyntaxBlockKind.Func), content)
            break
          }
          case SemanticContextType.StateScope: {
            this.createBlock(SyntaxBlockKind.Statement, position, this.getLatestBlockId(SyntaxBlockKind.State), content)
            break
          }
          case SemanticContextType.InvariantScope: {
            this.createBlock(SyntaxBlockKind.Statement, position, this.getLatestBlockId(SyntaxBlockKind.Invariant), content)
            break
          }
        }
        break
      }
      case SemanticContextType.LocalVariableGroup: {
        // For now, local var can only exist in fn
        this.createBlock(SyntaxBlockKind.SingleTypedVariableGroup, position, this.getLatestBlockId(SyntaxBlockKind.Func), {
          varKind: IdentifierKind.LocalVariable
        })

        break
      }

      case SemanticContextType.StateDecl: {
        this.createBlock(SyntaxBlockKind.State, position, this.getLatestBlockId(SyntaxBlockKind.Machine))
        break
      }

      case SemanticContextType.TransDecl: {
        this.createBlock(SyntaxBlockKind.Transition, position, this.getLatestBlockId(SyntaxBlockKind.Machine))
        break
      }

      case SemanticContextType.InvariantDecl: {
        this.createBlock(SyntaxBlockKind.Invariant, position, this.getLatestBlockId(SyntaxBlockKind.Machine))
        break
      }

      case SemanticContextType.GoalScope: {
        this.createBlock(SyntaxBlockKind.Goal, position, this.getLatestBlockId(SyntaxBlockKind.Machine))
        break
      }

      case SemanticContextType.AssertExpr: {
        this.createBlock(SyntaxBlockKind.Assertion, position, this.getLatestBlockId(SyntaxBlockKind.Goal))
        break
      }

      case SemanticContextType.PathAssignStatement: {
        this.createBlock(SyntaxBlockKind.PathStatement, position, this.getLatestBlockId(SyntaxBlockKind.Goal), {
          code: getExpression(payload)
        })
        break
      }

      case SemanticContextType.LetDecl: {
        this.createBlock(SyntaxBlockKind.PathVariable, position, this.getLatestBlockId(SyntaxBlockKind.Goal))
        break
      }
    }
  }

  #onAnalyzerBlockExit(context, {block}) {
    const {type, position, metadata} = block
    switch (type) {
      case SemanticContextType.CompilerOption: {
        const {name, value} = metadata
        this.markData(SyntaxBlockKind.CompilerOption, {
          name,
          value
        })
        break
      }
      case SemanticContextType.RecordDecl: {
        this.markData(SyntaxBlockKind.Record, {
          identifier: metadata.identifier
        })
        break
      }
      case SemanticContextType.WhereExpr: {
        const trans = context.findNearestBlock(SemanticContextType.TransDecl)
        if (!trans) {
          // trans is handled by trans's metadata
          this.markData(SyntaxBlockKind.Variable, {
            codeWhere: metadata.expr
          })
        }
        break
      }

      case SemanticContextType.RecordVariableDeclGroup:
      case SemanticContextType.LocalVariableGroup:
      case SemanticContextType.GlobalVariableGroup:
      case SemanticContextType.GlobalConstantGroup: {
        if (metadata.fieldType === IdentifierType.Enum) {
          this.getLatestBlock(SyntaxBlockKind.SingleTypedVariableGroup).data.enums = metadata.enums
        }
        break
      }
      case SemanticContextType.FnDecl: {
        const [{input, output}] = metadata.signatures
        // align & write data
        const paramBlocks = this.context.latestBlocks
          .get(SyntaxBlockKind.Variable)
          .filter(it => it.data.kind === IdentifierKind.FnParam)
          .slice(0 - input.length)
        for (let i = 0; i < input.length; i++) {
          const type = input[i]
          const block = paramBlocks[i]
          block.data.type = type
        }

        this.markData(SyntaxBlockKind.Func, {
          returnType: output,
          identifier: metadata.identifier
        })
        this.clearIdentifier(this.getLatestBlockId(SyntaxBlockKind.Func))
        break
      }

      case SemanticContextType.StateDecl: {
        const {identifier, attributes} = metadata
        this.markData(SyntaxBlockKind.State, {
          identifier, attributes
        })
        break
      }

      case SemanticContextType.TransDecl: {
        const {
          label,
          whereExpr,
          fromState,
          toStates,
          operators,
          excludedStates,
          involvedStates
        } = metadata

        // TODO: state identifier to (multiple, consider ill forms) block ids

        this.markData(SyntaxBlockKind.Transition, {
          label,
          codeWhere: whereExpr,
          fromState,
          toStates,
          operators,
          excludedStates,
          involvedStates
        })

        break
      }

      case SemanticContextType.InvariantDecl: {
        this.markData(SyntaxBlockKind.Invariant, {
          identifier: metadata.identifier
        })
        break
      }

      case SemanticContextType.InExpr: {
        const {identifiers} = metadata
        if (!identifiers?.length) {
          return
        }

        const semBlocks = context.findNearestBlockByTypes([
          SemanticContextType.InvariantDecl,
          SemanticContextType.AssertExpr
        ])

        switch (semBlocks.type) {
          case SemanticContextType.InvariantDecl: {
            this.markData(SyntaxBlockKind.Invariant, {inIdentifiers: identifiers})
            break
          }
          case SemanticContextType.AssertExpr: {
            this.markData(SyntaxBlockKind.Assertion, {inIdentifiers: identifiers})
            break
          }
        }
        break
      }

      case SemanticContextType.GoalScope: {
        this.markData(SyntaxBlockKind.Goal, {
          codeFinal: metadata.expr,
          invariants: metadata.invariants,
          states: metadata.states
        })
        this.clearIdentifier(this.getLatestBlockId(SyntaxBlockKind.Goal))
        break
      }

      case SemanticContextType.LetDecl: {
        this.markData(SyntaxBlockKind.PathVariable, {
          codeInit: metadata.body
        })
        break
      }
    }
  }

  // TODO: clear identifiers
  #onAnalyzerIdentifierRegister(context, {text, type, position, kind, blockType, recordIdent}) {
    switch (kind) {
      case IdentifierKind.EnumField: {
        this.markIdentifier(`#${text}`, this.context.latestBlock.id)
        break
      }
      case IdentifierKind.RecordField:
      case IdentifierKind.LocalVariable:
      case IdentifierKind.GlobalVariable:
      case IdentifierKind.GlobalConst: {
        this.markData(SyntaxBlockKind.SingleTypedVariableGroup, {
          type
        })
        const id = this.createBlock(SyntaxBlockKind.Variable, position, this.getLatestBlockId(SyntaxBlockKind.SingleTypedVariableGroup), {
          text,
          type,
          kind
        })

        if (kind !== IdentifierKind.RecordField) {
          this.markIdentifier(text, id, kind === IdentifierKind.LocalVariable ? this.getLatestBlockId(SyntaxBlockKind.Func) : null)
        } else {
          if (recordIdent) {
            this.markIdentifier(`${recordIdent}.${text}`, id)
          }
        }
        break
      }

      case IdentifierKind.FnParam: {
        const id = this.createBlock(SyntaxBlockKind.Variable, position, this.getLatestBlockId(SyntaxBlockKind.FnParamGroup), {
          text,
          type, // <- type here is always hole
          kind
        })
        this.markIdentifier(text, id, this.getLatestBlockId(SyntaxBlockKind.Func))
        break
      }

      case IdentifierKind.Machine: {
        const id = this.getLatestBlockId(SyntaxBlockKind.Machine)
        this.markIdentifier(text, id)
        break
      }
      case IdentifierKind.State: {
        const id = this.getLatestBlockId(SyntaxBlockKind.State)
        this.markIdentifier(text, id)
        break
      }
      case IdentifierKind.Trans: {
        const id = this.getLatestBlockId(SyntaxBlockKind.Transition)
        this.markIdentifier(text, id)
        break
      }
      case IdentifierKind.Let: {
        const id = this.getLatestBlockId(SyntaxBlockKind.PathVariable)
        this.markIdentifier(text, id, this.getLatestBlockId(SyntaxBlockKind.Goal))
        break
      }
      case IdentifierKind.Record: {
        const id = this.getLatestBlockId(SyntaxBlockKind.Record)
        this.markIdentifier(text, id)
        break
      }
      case IdentifierKind.FnName: {
        const id = this.getLatestBlockId(SyntaxBlockKind.Func)
        this.markIdentifier(text, id)
        break
      }
      case IdentifierKind.Invariant: {
        const id = this.getLatestBlockId(SyntaxBlockKind.Invariant)
        this.markIdentifier(text, id)
        break
      }
    }
  }

  #onAnalyzerIdentifierReference(context, {references}) {
    const path = context.currentBlockPath
    const kind = semanticTypePathToBlockKind(path)
    if (!kind || !references.length) {
      return
    }
    let ident
    if (references.length > 1) {
      // record
      ident = references[0].text + '.' + references[1].text
    } else if (references[0].isEnum) {
      // enum
      ident = '#' + references[0].text
    } else {
      ident = references[0].text
    }
    this.markReference(kind, ident)
  }

  #onAnalyzerErrors(context, errors) {
    const path = context.currentBlockPath
    const kind = semanticTypePathToBlockKind(path)
    if (!kind) {
      return
    }
    this.markErrors(kind, errors)
  }

  attach(analyzer) {
    analyzer.on("block:enter", (...args) => this.#onAnalyzerBlockEnter(...args))
    analyzer.on("block:exit", (...args) => this.#onAnalyzerBlockExit(...args))
    analyzer.on("identifier:register", (...args) => this.#onAnalyzerIdentifierRegister(...args))
    analyzer.on("identifier:reference", (...args) => this.#onAnalyzerIdentifierReference(...args))
    analyzer.on("errors", (...args) => this.#onAnalyzerErrors(...args))
  }
}