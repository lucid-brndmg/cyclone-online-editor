import {IdentifierKind, IdentifierType, SemanticContextType} from "@/core/definitions";
import {getExpression} from "@/core/utils/antlr";
import {StackedTable} from "@/lib/storage";

const GraphicalBlockKind = {
  CompilerOption: 1,
  Machine: 2,
  State: 3,
  Transition: 4,
  Assertion: 5,
  Variable: 6,
  Func: 7,
  Goal: 8,
  Invariant: 9,
  Statement: 10,
  PathVariable: 11,
  PathStatement: 12,
  Record: 13,
  SingleTypedVariableGroup: 14,
  FnParamGroup: 15,
  Error: 99
}

// graphicalNodeBlockKinds, graphicalTableBlockKinds, graphicalCodeBlockKinds = new Set()

const kindIdPrefix = {
  [GraphicalBlockKind.CompilerOption]: "copt",
  [GraphicalBlockKind.Machine]: "graph",
  [GraphicalBlockKind.State]: "state",
  [GraphicalBlockKind.Transition]: "trans",
  [GraphicalBlockKind.Assertion]: "assert",
  [GraphicalBlockKind.Variable]: "var",
  [GraphicalBlockKind.Func]: "fn",
  [GraphicalBlockKind.Goal]: "goal",
  [GraphicalBlockKind.Invariant]: "inv",
  [GraphicalBlockKind.Statement]: "stmt",
  [GraphicalBlockKind.PathVariable]: "pvar",
  [GraphicalBlockKind.PathStatement]: "pstmt",
  [GraphicalBlockKind.Record]: "rec",
  [GraphicalBlockKind.SingleTypedVariableGroup]: "stvargrp",
  [GraphicalBlockKind.FnParamGroup]: "fnvargrp",
  [GraphicalBlockKind.Error]: "err"
}

const idPrefixKind = (() => {
  const result = {}
  Object.entries(kindIdPrefix).forEach(([kind, pref]) => {
    result[pref] = parseInt(kind)
  })
  return result
})()

const buildId = (kind, numId) => {
  return `${kindIdPrefix[kind]}:${numId}`
}

const idToKind = id => {
  return idPrefixKind[id.split(":")[0]]
}

// "IR-I"
export default class GraphicalBlockBuilder {
  context

  constructor() {
    this.context = {
      blocks: [],
      latestBlocks: new StackedTable(),
      ids: new Map(),
      unsortedError: [],
      idBlocks: new Map(),
      childBlocks: new StackedTable(),
      // ids: {
      //   compilerOption: 0,
      //   machine: 0,
      //   state: 0,
      //   transition: 0,
      //   assertion: 0,
      //   variable: 0,
      //   func: 0,
      //   goal: 0,
      //   invariant: 0,
      //   statement: 0,
      //   pathVariable: 0,
      //   pathStatement: 0,
      //   record: 0
      // }
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
      childReferences: new Set(),
      kind,
      data: data ?? {}
    }
    this.context.blocks.push(block)
    this.context.latestBlocks.push(kind, block)
    this.context.idBlocks.set(id, block)
    if (parentId) {
      this.context.childBlocks.push(parentId, block)
    }
  }

  followBlocks(parentId, acc = []) {
    const block = this.context.idBlocks.get(parentId)
    if (!block) {
      console.log("warn: no block found by id", parentId)
      return acc
    }
    if (!block.parentId) {
      return acc
    }

    acc.push(block)
    return this.followBlocks(block.parentId, acc)
  }

  createErrors(errors, kind) {
    return errors.map((error) => ({error, graphicalKind: kind, id: this.assignId(GraphicalBlockKind.Error)}))
  }

  markErrors(kind, errors, pushUnsorted = true) {
    const block = this.getLatestBlock(kind)
    const graphicalErrors = this.createErrors(errors, kind)
    if (!block) {
      if (pushUnsorted) {
        this.context.unsortedError.push(graphicalErrors)
      }
      return false
    }

    block.errors.push(...graphicalErrors)

    if (!block.parentId) {
      return true
    }

    const blocks = this.followBlocks(block.parentId)
    for (let block of blocks) {
      block.childErrors.push(...graphicalErrors)
    }
    return true
  }

  // markPositionNX(kind, position) {
  //   const block = this.getLatestBlock(kind)
  //   if (!block) {
  //     console.log("warn: no block found with kind", kind, position)
  //     return
  //   }
  //   if (!block.position) {
  //     block.position = position
  //   }
  // }

  markData(kind, data) {
    const block = this.getLatestBlock(kind)
    if (!block) {
      console.log("warn: no block found with data", kind, data)
      return
    }
    block.data = {...block.data, ...data}
  }

  markReference(kind, ...referenceBlockIds) {
    const block = this.getLatestBlockId(kind)
    if (!block) {
      console.log("warn: no block found with references", kind, referenceBlockIds)
      return
    }
    for (let id of referenceBlockIds) {
      block.references.add(id)
    }
    if (block.parentId) {
      const blocks = this.followBlocks(block.parentId)
      for (let block of blocks) {
        for (let id of referenceBlockIds) {
          block.childReferences.add(id)
        }
      }
    }
  }

  getLatestBlock(kind) {
    return this.context.latestBlocks.peek(kind)
  }

  getLatestBlockId(kind) {
    return this.context.latestBlocks.peek(kind)?.id
  }

  getLatestChildOf(kind) {
    const id = this.getLatestBlockId(kind)
    if (!id) {
      return null
    }

    return this.context.childBlocks.peek(id)
  }

  #onAnalyzerBlockEnter(context, {block, payload}) {
    const {type, position} = block
    switch (type) {
      case SemanticContextType.CompilerOption: {
        this.createBlock(GraphicalBlockKind.CompilerOption, position)
        break
      }
      case SemanticContextType.MachineDecl: {
        this.createBlock(GraphicalBlockKind.Machine, position)
        break
      }
      case SemanticContextType.GlobalVariableGroup:
      case SemanticContextType.GlobalConstantGroup: {
        this.createBlock(GraphicalBlockKind.SingleTypedVariableGroup, position, this.getLatestBlockId(GraphicalBlockKind.Machine), {
          varKind: type === SemanticContextType.GlobalVariableGroup
            ? IdentifierKind.GlobalVariable
            : IdentifierKind.GlobalConst,
        })
        break
      }

      case SemanticContextType.RecordDecl: {
        this.createBlock(GraphicalBlockKind.Record, position, this.getLatestBlockId(GraphicalBlockKind.Machine), {
          groupKind: IdentifierKind.Record
        })
        break
      }
      case SemanticContextType.RecordVariableDeclGroup: {
        this.createBlock(GraphicalBlockKind.SingleTypedVariableGroup, position, this.getLatestBlockId(GraphicalBlockKind.Record), {
          varKind: IdentifierKind.RecordField
        })
        break
      }
      case SemanticContextType.VariableInit: {
        const codeInit = getExpression(payload)
        this.markData(GraphicalBlockKind.Variable, {
          codeInit
        })
        break
      }
      case SemanticContextType.FnDecl: {
        this.createBlock(GraphicalBlockKind.Func, position, this.getLatestBlockId(GraphicalBlockKind.Machine), {
          statements: [],
          returnType: IdentifierType.Hole,
          identifier: ""
        })
        break
      }
      case SemanticContextType.FnParamsDecl: {
        this.createBlock(GraphicalBlockKind.FnParamGroup, position, this.getLatestBlockId(GraphicalBlockKind.Func))
        break
      }
      case SemanticContextType.Statement: {
        const semBlocks = context.findNearestBlockByTypes([
          SemanticContextType.FnBodyScope,
          SemanticContextType.InvariantScope,
          SemanticContextType.StateScope
        ])

        switch (semBlocks.type) {
          case SemanticContextType.FnBodyScope: {
            this.getLatestBlock(GraphicalBlockKind.Func).data.statements.push(getExpression(payload))
            break
          }
          // TODO: handle other scopes
        }
        break
      }
      case SemanticContextType.LocalVariableGroup: {
        // const semBlock = context.findNearestBlockByTypes([
        //   SemanticContextType.FnBodyScope,
        //
        // ])

        // For now, local var can only exist in fn

        this.createBlock(GraphicalBlockKind.SingleTypedVariableGroup, position, this.getLatestBlockId(GraphicalBlockKind.Func), {
          varKind: IdentifierKind.LocalVariable
        })

        break
      }
    }
  }

  #onAnalyzerBlockExit(context, {block}) {
    const {type, position, metadata} = block
    switch (type) {
      case SemanticContextType.CompilerOption: {
        const {name, value} = metadata
        this.markData(GraphicalBlockKind.CompilerOption, {
          name,
          value
        })
        break
      }
      case SemanticContextType.RecordDecl: {
        this.markData(GraphicalBlockKind.Record, {
          identifier: metadata.identifier
        })
        break
      }
      case SemanticContextType.WhereExpr: {
        const trans = context.findNearestBlock(SemanticContextType.TransDecl)
        if (trans) {
          // TODO: mark trans
        } else {
          this.markData(GraphicalBlockKind.Variable, {
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
          this.getLatestBlock(GraphicalBlockKind.SingleTypedVariableGroup).data.enums = metadata.enums
        }
        break
      }
      case SemanticContextType.FnDecl: {
        const [{input, output}] = metadata.signatures
        // align & write data
        const paramBlocks = this.context.latestBlocks
          .get(GraphicalBlockKind.Variable)
          .filter(it => it.data.kind === IdentifierKind.FnParam)
          .slice(0 - input.length)
        for (let i = 0; i < input.length; i++) {
          const type = input[i]
          const block = paramBlocks[i]
          block.data.type = type
        }

        this.markData(GraphicalBlockKind.Func, {
          returnType: output,
          identifier: metadata.identifier
        })
        break
      }
    }
  }

  #onAnalyzerIdentifierRegister(context, {text, type, position, kind, blockType}) {
    switch (kind) {
      case IdentifierKind.EnumField: {
        // let semBlockVar = context.findNearestBlockByTypes([SemanticContextType.LocalVariableGroup, SemanticContextType.GlobalVariableGroup, SemanticContextType.GlobalConstantGroup, SemanticContextType.RecordVariableDeclGroup])
        // if (!semBlockVar) {
        //   console.log("warn: no semantic block found for enumField", text)
        //   break
        // }
        // const data = (semBlockVar.type === SemanticContextType.RecordVariableDeclGroup
        //   ? this.getLatestBlock(GraphicalBlockKind.Variable)
        //   : this.getLatestBlock(GraphicalBlockKind.SingleTypedVariableGroup))
        //   .data


        // const data = this.getLatestBlock(GraphicalBlockKind.SingleTypedVariableGroup).data
        // if (data.enums) {
        //   data.enums.push(text)
        // } else {
        //   data.enums = [text]
        // }

        break
      }
      case IdentifierKind.RecordField:
      case IdentifierKind.LocalVariable:
      case IdentifierKind.GlobalVariable:
      case IdentifierKind.GlobalConst: {
        this.markData(GraphicalBlockKind.SingleTypedVariableGroup, {
          type
        })
        this.createBlock(GraphicalBlockKind.Variable, position, this.getLatestBlockId(GraphicalBlockKind.SingleTypedVariableGroup), {
          text,
          type,
          kind
        })
        // const data = this.getLatestBlock(GraphicalBlockKind.SingleTypedVariableGroup).data
        // data.members.push(text)
        break
      }

      case IdentifierKind.FnParam: {
        this.createBlock(GraphicalBlockKind.Variable, position, this.getLatestBlockId(GraphicalBlockKind.FnParamGroup), {
          text,
          type, // <- type here is always hole
          kind
        })
        break
      }
      // case IdentifierKind.RecordField: {
      //   this.createBlock(GraphicalBlockKind.Variable, position, this.getLatestBlockId(GraphicalBlockKind.Record), {
      //     text, type
      //   })
      //   // const data = this.getLatestBlock(GraphicalBlockKind.Record).data
      //   // data.fields.push({type, text})
      //   break
      // }
    }
  }

  #onAnalyzerIdentifierReference(context, {references}) {
  }

  #onAnalyzerErrors(context, errors) {
  }

  attach(analyzer) {
    analyzer.on("block:enter", (...args) => this.#onAnalyzerBlockEnter(...args))
    analyzer.on("block:exit", (...args) => this.#onAnalyzerBlockExit(...args))
    analyzer.on("identifier:register", (...args) => this.#onAnalyzerIdentifierRegister(...args))
    analyzer.on("identifier:reference", (...args) => this.#onAnalyzerIdentifierReference(...args))
    analyzer.on("errors", (...args) => this.#onAnalyzerErrors(...args))
  }
}