import {ActionKind, IdentifierType, SemanticContextType} from "@/core/definitions";
import CycloneParserListener from "@/generated/antlr/CycloneParserListener";
import {posPair} from "@/lib/position";
import {
  dotIdentifierExprMetadata,
  enumDeclarationMetadata,
  functionCallMetadata,
  functionDeclarationMetadata,
  functionParamsMetadata,
  functionScopeMetadata,
  stateDeclMetadata,
  transDeclMetadata
} from "@/core/utils/semantic";

const getBlockPositionPair = ctx => {
  const text = ctx.start.text || ctx.stop.text
  const textLength= !text || text === "<EOF>" ? 1 : text.length
  const startLine = ctx.start.line
  const stopLine = ctx.stop.line
  const startCol = ctx.start.column
  const stopCol = ctx.stop.column

  return posPair(
    startLine, startCol,
    stopLine, stopCol + (stopLine === startLine && stopCol === startCol ? textLength : 0) // + textLength
  )
}

const getSymbolPosition = (symbol, length) => {
  const line = symbol.line
  const col = symbol.column
  return posPair(
    line, col,
    line, col + (length || symbol.text.length)
  )
}

export class SemanticListener extends CycloneParserListener {
  analyzer

  constructor(semanticAnalyzer) {
    super();
    this.analyzer = semanticAnalyzer
  }

  enterMachine(ctx) {
    // this.analyzer.pushBlock(
    //   SemanticContextType.Machine
    // )
    this.analyzer.pushBlock(SemanticContextType.MachineDecl, getBlockPositionPair(ctx))

    // console.log("enter machine", ctx, ctx.start.line, ctx.start.column, ctx.stop.line, ctx.stop.column)
  }

  exitMachine(ctx) {
    // super.exitMachine(ctx);
    // console.log("exit machine", ctx)
    this.analyzer.popBlock()

    const token = ctx.children.find(child => {
      const kwd = child?.symbol?.text
      return kwd === "machine" || kwd === "graph"
    })

    if (token) {
      const symbol = token.symbol
      this.analyzer.handleMachineDecl(getSymbolPosition(symbol))
    }
  }

  enterMachineScope(ctx) {
    // console.log("enter machine scope")
    this.analyzer.pushBlock(SemanticContextType.MachineScope, getBlockPositionPair(ctx))
  }

  exitMachineScope(ctx) {
    // console.log("exit machine scope")

    this.analyzer.popBlock()
    
  }

  enterStateExpr(ctx) {
    this.analyzer.pushBlock(SemanticContextType.StateDecl, getBlockPositionPair(ctx), stateDeclMetadata())
  }

  exitStateExpr(ctx) {
    const block = this.analyzer.popBlock()

    let isStart = false
    let isAbstract = false
    let isNormal = false
    let isFinal = false
    let isNode = false
    for (let child of ctx.children) {
      if (child?.symbol?.text === "node") {
        isNode = true
      } else {
        switch (child.start?.text) {
          case "start": isStart = true; break;
          case "abstract": isAbstract = true; break;
          case "normal": isNormal = true; break;
          case "final": isFinal = true; break;
        }
      }
    }

    this.analyzer.handleStateDecl(block, {isAbstract, isStart, isNormal, isFinal, isNode}, getBlockPositionPair(ctx))
  }

  enterStateScope(ctx) {
    this.analyzer.peekBlock().metadata.hasChildren = ctx.children.length > 2
    this.analyzer.pushBlock(SemanticContextType.StateScope, getBlockPositionPair(ctx))
  }

  exitStateScope(ctx) {
    this.analyzer.popBlock()
    
  }

  enterStatement(ctx) {
    this.analyzer.handleStatement(getBlockPositionPair(ctx))
  }

  exitStatement(ctx) {
    this.analyzer.resetTypeStack()
  }

  enterTrans(ctx) {
    this.analyzer.pushBlock(SemanticContextType.TransDecl, getBlockPositionPair(ctx), transDeclMetadata())
  }

  exitTrans(ctx) {
    const block = this.analyzer.popBlock()
    this.analyzer.handleTrans(block)
  }

  enterTransScope(ctx) {
    this.analyzer.pushBlock(SemanticContextType.TransScope, getBlockPositionPair(ctx))
  }

  exitTransScope(ctx) {
    // check
    this.analyzer.popBlock()
  }

  enterTransDef(ctx) {
    for (let child of ctx.children) {
      const text = child?.symbol?.text
      switch (text) {
        case "+":
        case "*": this.analyzer.handleTransOp(text); break;
      }
    }
  }

  enterTransOp(ctx) {
    const text = ctx.start.text
    this.analyzer.handleTransOp(text)
  }

  enterLabel(ctx) {
    this.analyzer.handleTransLabel(ctx.start.text)
  }

  enterTransExclExpr(ctx) {
    this.analyzer.handleTransExclusion(true)
  }

  exitTransExclExpr(ctx) {
    this.analyzer.handleTransExclusion(false)
  }

  exitWhereExpr(ctx) {
    const expr = ctx.start.getInputStream().getText(ctx.start.start, ctx.stop.stop)
    this.analyzer.handleTransWhereExpr(expr)
    this.analyzer.deduceToType(IdentifierType.Bool, getBlockPositionPair(ctx))
  }

  enterInvariantExpression(ctx) {
    this.analyzer.pushBlock(SemanticContextType.InvariantDecl, getBlockPositionPair(ctx))
  }

  exitInvariantExpression(ctx) {
    this.analyzer.popBlock()
  }

  enterInExpr(ctx) {
    this.analyzer.pushBlock(SemanticContextType.InExpr, getBlockPositionPair(ctx))
  }

  exitInExpr(ctx) {
    this.analyzer.popBlock()
  }

  enterInvariantScope(ctx) {
    this.analyzer.pushBlock(SemanticContextType.InvariantScope, getBlockPositionPair(ctx))
  }

  exitInvariantScope(ctx) {
    this.analyzer.popBlock()
  }

  enterGoal(ctx) {
    this.analyzer.pushBlock(SemanticContextType.GoalScope, getBlockPositionPair(ctx))
    this.analyzer.handleGoal()
  }

  exitGoal(ctx) {
    this.analyzer.popBlock()
  }

  exitForExpr(ctx) {
    // no check needed
    this.analyzer.resetTypeStack()
  }

  enterStopExpr(ctx) {
    this.analyzer.pushBlock(SemanticContextType.Stop, getBlockPositionPair(ctx))
  }

  exitStopExpr(ctx) {
    // check
    this.analyzer.popBlock()
    
  }

  enterWithExpr(ctx) {
    this.analyzer.pushBlock(SemanticContextType.With, getBlockPositionPair(ctx))
  }

  exitWithExpr(ctx) {
    // check

    this.analyzer.popBlock()
    
  }

  enterLetExpr(ctx) {
    this.analyzer.pushBlock(SemanticContextType.LetDecl, getBlockPositionPair(ctx))
  }

  exitLetExpr(ctx) {
    // check

    this.analyzer.popBlock()
    this.analyzer.deduceToType(IdentifierType.Bool, getBlockPositionPair(ctx), null, false, true)
    
  }

  enterStateIncExpr(ctx) {
    this.analyzer.pushBlock(SemanticContextType.StateInc, getBlockPositionPair(ctx))
  }

  exitStateIncExpr(ctx) {
    this.analyzer.popBlock()
    // this.#deduceToType(IdentifierType.State, getBlockPositionPair(ctx), IdentifierType.Bool)
    // this.analyzer.resetTypeStack() // for int literals
    this.analyzer.pushKnownType(IdentifierType.Bool)
  }

  enterPathPrimaryExpr(ctx) {
    this.analyzer.pushBlock(SemanticContextType.PathPrimary, getBlockPositionPair(ctx))
  }

  exitPathPrimaryExpr(ctx) {
    this.analyzer.popBlock()
    // this.analyzer.resetTypeStack()
    this.analyzer.pushKnownType(IdentifierType.Bool)
  }

  enterRecord(ctx) {
    this.analyzer.pushBlock(SemanticContextType.RecordDecl, getBlockPositionPair(ctx))
  }

  exitRecord(ctx) {
    this.analyzer.popBlock()
  }

  enterRecordScope(ctx) {
    this.analyzer.pushBlock(SemanticContextType.RecordScope, getBlockPositionPair(ctx))
  }

  exitRecordScope(ctx) {
    this.analyzer.popBlock()
  }

  enterGlobalConstant(ctx) {
    this.analyzer.pushBlock(SemanticContextType.GlobalConstantDecl, getBlockPositionPair(ctx))
  }

  exitGlobalConstant(ctx) {
    const block = this.analyzer.popBlock()
    this.analyzer.deduceVariableDecl(block, getBlockPositionPair(ctx))
  }

  enterEnumType(ctx) {
    this.analyzer.handleTypeToken("enum")
    this.analyzer.pushBlock(SemanticContextType.EnumDecl, getBlockPositionPair(ctx), enumDeclarationMetadata())
  }

  exitEnumType(ctx) {
    this.analyzer.popBlock()
  }

  enterGlobalVariableDecl(ctx) {
    this.analyzer.pushBlock(SemanticContextType.GlobalVariableDecl, getBlockPositionPair(ctx))
  }

  exitGlobalVariableDecl(ctx) {
    const block = this.analyzer.popBlock()
    this.analyzer.deduceVariableDecl(block, getBlockPositionPair(ctx))
  }

  enterLocalVariableDecl(ctx) {
    this.analyzer.pushBlock(SemanticContextType.LocalVariableDecl, getBlockPositionPair(ctx))
  }

  exitLocalVariableDecl(ctx) {
    const block = this.analyzer.popBlock()
    this.analyzer.deduceVariableDecl(block, getBlockPositionPair(ctx))
  }

  enterRecordVariableDecl(ctx) {
    this.analyzer.pushBlock(SemanticContextType.RecordVariableDecl, getBlockPositionPair(ctx))
  }

  exitRecordVariableDecl(ctx) {
    const block = this.analyzer.popBlock()
    this.analyzer.deduceVariableDecl(block, getBlockPositionPair(ctx))
  }

  enterExpression(ctx) {
    const block = this.analyzer.peekBlock()
    if (block.type === SemanticContextType.FnCall) {
      block.metadata.gotParams += 1
    }

    this.analyzer.pushBlock(SemanticContextType.Expression, getBlockPositionPair(ctx))
  }

  exitExpression(ctx) {
    this.#handleBinaryOp(ctx)
    this.analyzer.popBlock()
  }

  // enterAssertExpr(ctx) {
  //   this.analyzer.pushBlock(SemanticContextType.Assert, getBlockPositionPair(ctx))
  // }

  exitAssertExpr(ctx) {
    // this.analyzer.popBlock()

    this.analyzer.deduceToType(IdentifierType.Bool, getBlockPositionPair(ctx))
  }

  enterFunctionDeclaration(ctx) {
    this.analyzer.pushBlock(SemanticContextType.FnDecl, getBlockPositionPair(ctx), functionDeclarationMetadata())
  }

  exitFunctionDeclaration(ctx) {
    this.analyzer.popBlock()
  }

  enterFunctionBodyScope(ctx) {
    this.analyzer.pushBlock(SemanticContextType.FnBodyScope, getBlockPositionPair(ctx), functionScopeMetadata())
  }

  exitFunctionBodyScope(ctx) {
    this.analyzer.popBlock()
  }

  // enterReturnExpr(ctx) {
  //
  // }

  exitReturnExpr(ctx) {
    this.analyzer.handleReturn(getBlockPositionPair(ctx))
  }

  enterFunctionParamsDecl(ctx) {
    this.analyzer.pushBlock(SemanticContextType.FnParamsDecl, getBlockPositionPair(ctx), functionParamsMetadata())
  }

  exitFunctionParamsDecl(ctx) {
    this.analyzer.popBlock()
  }

  enterFunCall(ctx) {
    this.analyzer.pushBlock(SemanticContextType.FnCall, getBlockPositionPair(ctx), functionCallMetadata())
  }

  exitFunCall(ctx) {
    const block = this.analyzer.popBlock()
    if (!block.metadata) {
      console.log("warn: invalid block when exit fnCall", block)
      return
    }
    this.analyzer.deduceActionCall(ActionKind.Function, block.metadata.fnName, block.metadata.gotParams, getBlockPositionPair(ctx))
  }

  enterPrimary(ctx) {
    this.analyzer.pushBlock(SemanticContextType.Primary, getBlockPositionPair(ctx))
  }

  exitPrimary(ctx) {
    this.analyzer.popBlock()
  }

  enterAnnotationExpr(ctx) {
    this.analyzer.pushBlock(SemanticContextType.AnnotationDecl, getBlockPositionPair(ctx))
  }

  exitAnnotationExpr(ctx) {
    this.analyzer.popBlock()
  }

  enterEnumLiteral(ctx) {
    const block = this.analyzer.peekBlock()
    if (!block) {return}
    const text = ctx.start.text
    const identText = text.slice(1)
    this.analyzer.referenceEnum(identText, getBlockPositionPair(ctx))

    // this.analyzer.pushKnownType(IdentifierType.Enum)
  }

  enterIdentifier(ctx) {
    const hasBlock = this.analyzer.hasBlock()
    if (!hasBlock) {return}
    const text = ctx.start.text
    this.analyzer.handleIdentifier(text, getBlockPositionPair(ctx))
  }

  enterDotIdentifierExpr(ctx) {
    this.analyzer.pushBlock(SemanticContextType.DotExpr, getBlockPositionPair(ctx), dotIdentifierExprMetadata())
  }

  exitDotIdentifierExpr(ctx) {
    this.analyzer.popBlock()
  }

  enterPrimitiveType(ctx) {
    const text = ctx.start.text
    this.analyzer.handleTypeToken(text)
  }

  enterBoolLiteral(ctx) {
    this.analyzer.pushKnownType(IdentifierType.Bool)
  }

  enterCharLiteral(ctx) {
    this.analyzer.pushKnownType(IdentifierType.Char)
  }

  enterIntLiteral(ctx) {
    const blockType = this.analyzer.peekBlock().type

    if (blockType !== SemanticContextType.StateInc && blockType !== SemanticContextType.PathPrimary) {
      this.analyzer.pushKnownType(IdentifierType.Int)

    }
  }

  enterRealLiteral(ctx) {
    this.analyzer.pushKnownType(IdentifierType.Real)
  }

  enterStringLiteral(ctx) {
    this.analyzer.pushKnownType(IdentifierType.String)
  }

  exitPathCondAssignExpr(ctx) {
    this.analyzer.deduceToType(IdentifierType.Bool, getBlockPositionPair(ctx))
    // this.analyzer.handlePathCondAssign()
  }

  exitPathExpr(ctx) {
    // only used in VIA
    this.analyzer.deduceToType(IdentifierType.Bool, getBlockPositionPair(ctx))
  }

  #handleBinaryOp(ctx) {
    for (let child of ctx.children) {
      const symbol = child.symbol
      if (symbol) {
        const op = symbol.text
        // console.log("exit bin op", op)
        this.analyzer.deduceActionCall(ActionKind.InfixOperator, op, 2, getSymbolPosition(symbol, op.length))
      }
    }
  }

  #handleUnaryOp(ctx) {
    // console.log("possible unary", ctx)

    if (ctx.children.length !== 2) {
      return
    }

    const isSuffix = ctx.children[1].hasOwnProperty("symbol")
    const symbol = ctx.children[isSuffix ? 1 : 0]?.symbol
    const op = symbol?.text
    if (op) {
      // console.log("exit unary op", op)
      this.analyzer.deduceActionCall(isSuffix ? ActionKind.SuffixOperator : ActionKind.PrefixOperator, op, 1, getSymbolPosition(symbol, op.length))
    }
  }

  exitAdditiveExpression(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitMultiplicativeExpression(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitPowExpression(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitRelationalExpression(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitEqualityExpression(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitConditionalXorExpression(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitConditionalAndExpression(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitConditionalOrExpression(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitConditionalImpliesExpression(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitUnaryExpression(ctx) {
    this.#handleUnaryOp(ctx)
  }

  exitUnaryExpressionNotPlusMinus(ctx) {
    this.#handleUnaryOp(ctx)
  }

  exitUnaryPathCondition(ctx) {
    this.#handleUnaryOp(ctx)
  }

  exitXorPathCondition(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitAndPathCondition(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitOrPathCondition(ctx) {
    this.#handleBinaryOp(ctx)
  }

  exitPathCondition(ctx) {
    this.analyzer.deduceToType(IdentifierType.Bool, getBlockPositionPair(ctx), IdentifierType.Bool)
  }

  exitOneExpr(ctx) {
    this.analyzer.deduceAllToType(IdentifierType.Bool, getBlockPositionPair(ctx), IdentifierType.Bool, 2)
  }

  enterInitialExpr(ctx) {
    this.analyzer.checkNamedExpr(
      "initial",
      getBlockPositionPair(ctx),
      `'initial' expression can only be used in global / state / node scope, and not in constant definition`,
      [SemanticContextType.StateScope, SemanticContextType.GoalScope]
    )
  }

  exitInitialExpr(ctx) {
    this.analyzer.deduceToType(null, getBlockPositionPair(ctx), null, true)
    // this.analyzer.deduceActionCall(ActionKind.Function, "initial", 1, getBlockPositionPair(ctx))
  }

  enterFreshExpr(ctx) {
    this.analyzer.checkNamedExpr(
      "fresh",
      getBlockPositionPair(ctx),
      `'fresh' expression can only be used in global / state / node scope, and not in constant definition`,
      [SemanticContextType.StateScope, SemanticContextType.GoalScope]
    )
  }

  exitFreshExpr(ctx) {
    this.analyzer.deduceToMultiTypes([
      IdentifierType.Bool,
      IdentifierType.Real,
      IdentifierType.Int,
      IdentifierType.Enum,
      IdentifierType.String,
      IdentifierType.Char
    ], getBlockPositionPair(ctx), null, true)
  }

  enterCompOptions(ctx) {
    const optName = ctx.children[1]?.children[0]?.symbol?.text
    if (!optName) {
      console.log("warn: unable to get option name")
      return
    }

    const lit = ctx.children[3]?.children[0]?.children[0]?.symbol?.text
    if (!lit) {
      console.log("warn: unable to get option value")
      return
    }

    // console.log("option", optName, lit)

    this.analyzer.checkOption(optName, lit, getBlockPositionPair(ctx))
  }

  exitCompOptions(ctx) {
    this.analyzer.resetTypeStack()
  }
}