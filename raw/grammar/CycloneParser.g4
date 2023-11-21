parser grammar CycloneParser;
options { tokenVocab = CycloneLexer; }

identifier:
  IDENT
  ;

head: compOptions;

compOptions: 
  OPTION optionName EQUAL literal SEMI;

optionName:
  DEBUG
  | LOG
  | OUTPUT
  | TRACE
  | PRECISION
  | TIMEOUT
  | DETECT
  ;

machine:
  (compOptions)*
  (MACHINE | GRAPH) identifier machineScope EOF
  ;

machineScope:
  LBRACE
  ((globalVariableDecl) | (globalConstant) | (record) | (functionDeclaration))*
  (stateExpr)*
  (trans)*
  (invariantExpression)*
  (goal)?
  RBRACE
  ;

stateExpr:
  (stateModifier)* (STATE | NODE) identifier
  stateScope
  ;

stateScope:
  LBRACE
  (statement)*
  RBRACE
  ;

trans:
  (TRANS1 | TRANS2 | EDGE) ((identifier))?
  transScope
  ;

//transScope:
//  LBRACE
//  (identifier)
//  (
//    (ARROW
//        (identifier (COMMA identifier)*
//        | STAR (LBRACK identifier (COMMA identifier)* RBRACK)?
//        | PLUS (LBRACK identifier (COMMA identifier)* RBRACK)?))
//    | (BI_ARROW
//        (identifier (COMMA identifier)*
//        | STAR (LBRACK identifier (COMMA identifier)* RBRACK)?
//        | PLUS (LBRACK identifier (COMMA identifier)* RBRACK)?))
//  )
//  ((ON | LABEL) label)?
//  (whereExpr SEMI)?
//  RBRACE
//  ;

transScope:
    LBRACE identifier
    (transOp transDef)
    ((ON | LABEL) label)?
    (whereExpr SEMI)?
    RBRACE
    ;

transOp: ARROW | BI_ARROW;
transDef: identifier (COMMA identifier)*
          | STAR transExclExpr?
          | PLUS transExclExpr?
          ;
transExclExpr:
    LBRACK identifier (COMMA identifier)* RBRACK
    ;

invariantExpression:
  INVARIANT identifier
  invariantScope
  (inExpr)?
  ;

inExpr:
  IN LPAREN identifier (COMMA identifier)* RPAREN
  ;

invariantScope:
  LBRACE (statement) RBRACE
  ;

goal:
  GOAL 
  LBRACE 
  (
    (letExpr)
    | (identifier pathCondAssignExpr SEMI)
    | (assertExpr)
  )*
  (CHECK | ENUMERATE) forExpr (viaExpr)? (withExpr)? (stopExpr)?
  RBRACE
  ;

forExpr:
  (FOR | EACH | UPTO) intLiteral (COMMA intLiteral)*
  ;

stopExpr:
  ((REACH | STOP) LPAREN identifier (COMMA identifier)* RPAREN)
  ;

viaExpr:
  (VIA | CONDITION) LPAREN (pathExpr (COMMA pathExpr)*) RPAREN
  ;

withExpr:
  WITH LPAREN (identifier (COMMA identifier)*) RPAREN
  ;

letExpr:
  LET identifier (pathCondAssignExpr)? SEMI
  ;

pathCondAssignExpr:
  EQUAL pathCondition
  ;

pathExpr:
  pathCondition
  ;

pathCondition:
  orPathCondition
  ;

orPathCondition:
  andPathCondition (OR andPathCondition)*
  ;

andPathCondition:
  xorPathCondition (AND xorPathCondition)*
  ;

xorPathCondition:
  unaryPathCondition (HAT unaryPathCondition)*
  ;

unaryPathCondition:
  NOT unaryPathCondition
  | primaryCondition
  | parPathCondition
  ;

primaryCondition:
  stateIncExpr
  | pathPrimaryExpr
  | boolLiteral
  ;

parPathCondition:
  LPAREN pathCondition RPAREN
  ;

// ident reference
// see: https://classicwuhao.github.io/cyclone_tutorial/expr/place-left-op.html
stateIncExpr:
  (
    SHIFT_LEFT (intLiteral)?
    | SHIFT_RIGHT (intLiteral)?
  )?
  identifier (HAT LBRACE intLiteral (COLON intLiteral)? RBRACE)?
  | (
    (SHIFT_LEFT (intLiteral)? | SHIFT_RIGHT (intLiteral)?)?
    LPAREN identifier
    (HAT LBRACE intLiteral (COLON intLiteral)? RBRACE)?
    RPAREN
  )
  ;

pathPrimaryExpr:
  (
    (
      identifier 
      | pathOp (LBRACK identifier (COMMA identifier)* RBRACK)?
    )

    (
      ARROW
      (identifier | pathOp (LBRACK identifier (COMMA identifier)* RBRACK)?)
    )+
  )
  | (
    (SHIFT_LEFT (intLiteral)? | SHIFT_RIGHT (intLiteral)?)?
    LPAREN
    (identifier | pathOp (LBRACK identifier (COMMA identifier)* RBRACK)?)
    (ARROW (identifier | pathOp (LBRACK identifier (COMMA identifier)* RBRACK)?))+
    RPAREN
    ((HAT LBRACE intLiteral) (COLON intLiteral)? RBRACE)?
  )
  ;

pathOp: P_OP_ONE;

label:
  STRINGLITERAL
  ;

stateModifier:
  START
  | FINAL
  | ABSTRACT
  | NORMAL
  ;

literal:
  intLiteral
  | realLiteral
  | boolLiteral
  | stringLiteral
  | charLiteral
  | enumLiteral
  ;

intLiteral: INTLITERAL;
realLiteral: REALLITERAL;
boolLiteral: BOOLLITERAL;
stringLiteral: STRINGLITERAL;
charLiteral: CHARLITERAL;

// consider drop(1) (the #) when register?
enumLiteral:
  ENUMLITERAL
  ;

// decl
record:
  RECORD identifier
  recordScope
  SEMI
  ;

recordScope:
  LBRACE
  recordVariableDeclGroup
  RBRACE
  ;

recordVariableDeclGroup:
  (recordVariableDecl)+
  ;

recordVariableDecl:
  type variableDeclarator SEMI
  ;

// registration
globalConstant:
  CONST type identifier EQUAL variableInitializer
  (COMMA identifier EQUAL variableInitializer)*
  SEMI
  ;

// listen
globalVariableDecl:
  type variableDeclarator
  (COMMA variableDeclarator)*
  SEMI
  ;

// listen
localVariableDecl:
  type variableDeclarator
  (COMMA variableDeclarator)*
  SEMI
  ;

modifier:
  GLOBAL
  | NATIVE
  ;

type:
  primitiveType
  | enumType
  ;

primitiveType:
  INT
  | BOOL
  | REAL
  | STRING
  ;

// register
enumType:
  ENUM LBRACE identifier
  (COMMA identifier)* RBRACE
  ;

// skip current block, push parent block (global / localVariableDecl)
// enter: peek = globalVarDecl | localVariableDecl | recordDecl
variableDeclarator:
  identifier 
  (EQUAL variableInitializer)?
  (whereExpr)?
  ;

whereExpr:
  WHERE expression;

variableInitializer:
  expression
  ;

// reference
assertExpr:
  (annotationExpr)?
  ASSERT (ALWAYS | SOME)? expression
  (inExpr)?
  SEMI
  ;

statement:
  expression SEMI
  ;

expression:
  conditionalImpliesExpression ((EQUAL | ASSIGN_PLUS_EQ | ASSIGN_MINUS_EQ | ASSIGN_TIMES_EQ | ASSIGN_DIV_EQ) expression)?
  ;

conditionalImpliesExpression:
  conditionalOrExpression (IMPLIES conditionalOrExpression)*
  ;

conditionalOrExpression:
  conditionalAndExpression (OR conditionalAndExpression)*
  ;

conditionalAndExpression:
  conditionalXorExpression (AND conditionalXorExpression)*
  ;

conditionalXorExpression:
  equalityExpression (HAT equalityExpression)*
  ;

equalityExpression:
  relationalExpression ((DOUBLE_EQUAL | NOT_EQUAL) relationalExpression)*
  ;

relationalExpression:
  additiveExpression (( LESS_EQUAL | GREATER_EQUAL | LESS | GREATER) additiveExpression)*
  ;

additiveExpression:
  multiplicativeExpression ((PLUS | MINUS) multiplicativeExpression)*
  ;

multiplicativeExpression:
  powExpression ((STAR | SLASH | MOD) powExpression)*
  ;

powExpression:
  unaryExpression (TIMES_TIMES unaryExpression)*
  ;

unaryExpression:
  PLUS unaryExpression
  | MINUS unaryExpression
  | unaryExpressionNotPlusMinus
  ;
unaryExpressionNotPlusMinus:
  NOT unaryExpression
  | primary (MINUS_MINUS | PLUS_PLUS)?
  ;

// bool, bool (at least 2 expression, all bool)
oneExpr:
  ONE LPAREN (COMMA expression)+ RPAREN
  ;

freshExpr:
  FRESH LPAREN identifier RPAREN;

initialExpr:
  INITIAL LPAREN dotIdentifierExpr RPAREN;

// tbd
//prevExpr:
//  PREV LPAREN identifier RPAREN;

functionDeclaration:
  FUNCTION (identifier) COLON primitiveType
  functionBodyScope
  ;

functionBodyScope:
  functionParamsDecl
  LBRACE
  (localVariableDecl )*
  (statement)+
  RBRACE
  ;

functionParamsDecl:
  LPAREN
  (identifier COLON primitiveType )?
  (COMMA identifier COLON primitiveType )*
  RPAREN
  ;

returnExpr:
  RETURN expression
  ;

primary:
  parExpression
  | dotIdentifierExpr
  | literal // maybe this is not needed??
  // | prevExpr // PREV LPAREN identifier RPAREN // ???
  | initialExpr // INITIAL LPAREN dotIdentifierExpr RPAREN // same type as fresh
  | freshExpr // FRESH LPAREN identifier RPAREN // = copy(a) -> a
  | oneExpr
  | returnExpr
  | funCall
  ;

// to catch the dot expression: DotExprBlock -> enterDot (setFlag(DotExprBlock)) -> enterIdentifier(checkFlag(DotExprBlock))
dotIdentifierExpr:
  identifier (DOT identifier)?
  ;

parExpression:
  LPAREN expression RPAREN
  ;

funCall:
  identifier LPAREN expression (COMMA expression)* RPAREN
  ;

iteStatement:
  IF parExpression statement (ELSE statement)?
  ;

// register
annotationExpr:
  AT_SIGN LABEL COLON identifier;