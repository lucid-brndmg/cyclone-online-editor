---
title: "check"
keywords: ["check"]
id: "check"
---

The check statement specifies Cyclone to discover a single path that meets path conditions.

##### Syntax

The syntax of a check statement is as follows:

```cyclone
check (for|each) INT[,INT]*[condition(<PathCondition>)][reach (<Nodes>)]
``` 

A list of integers (separated by a comma) can be specified with for or each statement. Each integer here indicates the length of a path and this integer must be an integer that is greater or equal to 1. In a check statement, both [condition ](https://classicwuhao.github.io/cyclone_tutorial/expr/condition-expr.html)and [reach ](https://classicwuhao.github.io/cyclone_tutorial/expr/reach-expr.html)statements are optional.

Here is an example:

```cyclone
check for  5 
```

It asks Cyclone to discover a path that has a length of 5.

##### Scope

The check statement can only appear in the goal section. A Cyclone specification cannot have more than one check statements.

##### Semantics

The check statement issues a query to Cyclone's compiler to discover a path **p** (with a length k) that provably meets the set of path conditions defined over this **p**.

Compare to the [enumerate](https://classicwuhao.github.io/cyclone_tutorial/expr/enumerate-expr.html) statement, the check statement can quickly decide whether a graph has such path **p** or not. You can use the check statement in the following two ways:

When the for statement specifies a list of path lengths (each path length is separated by a comma), the compiler generates multiple conditions for every specified path length (in the list), combines them into a single condition and performs one check. Hence, it is also referred as **combo mode** in Cyclone. If there exists at least one path (with specified path length in the list) meets defined path conditions, the compiler will return a solution. Typically, the compiler returns any one of the valid paths if there are many. Hence, it is particularly useful for scenarios that you are not sure if there exists a valid path **p** with multiple different path lengths.

When the each statement is used to include a list of path lengths, the compiler generates multiple conditions for every specified path length (in the list) and performs a check individually for each specified path length. Thus, the compiler returns a path **p** for each specified path length that meets path conditions. This kind of checks is referred as **separation mode** in Cyclone. This is useful for scenarios that you would like to know individually whether a path with a particular length (from the list) is valid or not. Compare to **combo mode**, this is slightly more expensive since the compiler performs individual check for every specified path length.

##### Examples

```cyclone
check for 12 condition ((S5->S6->S7)^{3}) reach (S0,S3,S7)
```

The above check statement asks Cyclone whether current graph has a path **p** that has a length of 12 and reaches one of the nodes (S0,S3,S7) with one path condition that S5->S6->S7 must appear exactly **three** times in **p**.

```cyclone
check for 4,7,8,10,3 condition (S0->S1->S2) reach (S1)
```

The above check statement asks Cyclone to decide if there exists one path **p** with one of the lengths (4,7,8,10,3) that goes through S0->S1->S2 and reaches node S1.

```cyclone
check each 4,7,8,10,3 condition (S0->S1->S2) reach (S1)
```

The above check statement asks Cyclone to decide 5 paths individually with specified path lengths (4,7,8,10,3) that can go through S0->S1->S2 and reach node S1.