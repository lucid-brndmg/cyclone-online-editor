---
title: "condition / via"
keywords: ["condition", "via"]
id: "condition"
---

The condition statement specifies one or more path conditions over a path **p** to be discovered by Cyclone.

##### Syntax

The syntax of a condition statement is as follows:

```cyclone
[condition|via] (PathCondition1,PathCondition2,...,PathConditionn) 
```

Each **PathCondition** here can either be a compound path condition or a simple path condition.

Here is an example:

```cyclone
condition ( (S1->S2) && !(S2->S3), S4^{2}) 
```

##### Scope

The condition statement can only appear in either a [check](https://classicwuhao.github.io/cyclone_tutorial/expr/check-expr.html) or [enumeration](https://classicwuhao.github.io/cyclone_tutorial/expr/enumerate-expr.html) statement which can only appear in the goal section. The condition statement cannot be used alone. Typically, the condition statement is used as a part of a check or enumeration statement.

```cyclone
   check for 6 condition ( 
       (>>2(S1->S2) && (S3->_->S4)) || 
       (!(S5->S6) && !(S2->S4)) ) 
   reach (S0)
```

However, the condition statement can also be optional for check or enumeration statement.

##### Semantics

The condition statement specifies the kinds of path(s) to be discovered by Cyclone. The list of path conditions specified within the condition statement are logically conjoined.

```cyclone
condition ( (S3->S4->S5), S2, (S5->S6)^{3}) 
```

is the same as

```cyclone
condition ( ((S3->S4->S5) && S2 && (S5->S6)^{3}) ) 
```