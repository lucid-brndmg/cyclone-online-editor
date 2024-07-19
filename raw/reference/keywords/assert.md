---
title: "assert"
keywords: ["assert"]
id: "assert"
---

The assert statement specifies a content condition to be met by Cyclone.

##### Syntax

The syntax of an assert statement is as follows:

```cyclone
assert expression [in (state1,state2...staten)];
```

The **expression** here must be a boolean expression. An assert statement may explicitly specify a set of nodes (states), each nodei must be a defined node (with [normal](https://classicwuhao.github.io/cyclone_tutorial/expr/normal-key.html) modifier).

##### Scope

The assert statement must be used in the [goal](https://classicwuhao.github.io/cyclone_tutorial/expr/goal-expr.html) section. A goal section can contain zero or more assert statements.

##### Semantics

The assert statement asserts a boolean expression that describes a content condition. This content condition is joined with path conditions (specified in [condition](https://classicwuhao.github.io/cyclone_tutorial/expr/condition-expr.html) statement) to describe a path to be discovered. There are four ways of using an assert statement:

- If an assert statement asserts a boolean expression **b** without using an in clause, then this means that this **b** must hold in the **last** node of a path to be discovered. This is useful for discovering a path that can make **b** hold.
- If an assert statement asserts a boolean expression **b** using an in clause, then this means that this **b** must hold in one of the nodes specified by an in clause. This is useful for verifying whether **b** holds in one of the nodes.
- If an assert statement is used with the modifier some, this means that the condition must hold at some node(s) of the path to be discovered by Cyclone. This is similar to **EF** operator in CTL.
- If an assert statement is used with the modifier always, this means that the condition must hold at all the node(s) of the path to be discovered by Cyclone. This is similar to **EG** operator in CTL, comparing to an [invariant](https://classicwuhao.github.io/cyclone_tutorial/expr/invariant.html) in **AG** in CTL.

##### Example 1.

```cyclone
goal  { 
  assert  (x>=5 && x<=10); 
  check for 6 condition ( !(S1->S1) ) reach (S0) 
} 
```

The above goal section asks Cyclone to discover a path:

- has a length of 6.
- cannot contain a path pattern: S1->S1.
- must reach S0.
- when S0 is reached, x must stay between 5 and 10 in S0.

Hence, if a discovered path is: S0->S1->S2->S3->S4->S5->S0, then the boolean expression **x>=5 && x<=10** only needs to be satisfied in the node (S0).

##### Example 2.

Note the difference (bold font) between the following example and the one above.

```cyclone
goal  { 
  assert  (x>=5 && x<=10) in (S0,S4,S5); 
  check for 6 condition ( !(S1->S1) ) reach (S0) 
} 
```

The above goal section asks Cyclone to discover a path:

- has a length of 6.
- cannot contain a path pattern: S1->S1.
- must reach S0.
- x must stay between 5 and 10 in **S0 or S4 or S5**.

Thus, if a discovered path (containing multiple S0) is: S0->S1->S6->S0->S2->S3->S0, then the boolean expression **x>=5 && x<=10** must hold in every S0 in this path.