---
title: "enumerate"
keywords: ["enumerate"]
id: "enumerate"
---

The enumerate statement asks Cyclone to discover all possible path(s) that satisfy a list of path conditions.

##### Syntax

The syntax of an enumerate statement is as follows:

```cyclone
 enumerate for  INT [condition (<PathCondition>)] [reach (<Nodes>)]  
```

INT here indicates the length of a path and it must be an integer that is greater or equal to 1. In an enumerate statement, both [condition ](https://classicwuhao.github.io/cyclone_tutorial/expr/condition-expr.html)and [reach ](https://classicwuhao.github.io/cyclone_tutorial/expr/reach-expr.html)statements are optional.

Here is an example:

```cyclone
 enumerate for  5 
```

It asks Cyclone to discover all paths that have a length of 5.

##### Scope

The enumerate statement can only appear in the goal section. A Cyclone specification cannot have more than one enumerate statement.

##### Semantics

The enumerate statement asks Cyclone to discover all possible path(s) **p** (with a length k) that provably meets the set of path conditions defined over this **p**.

Compare to the [check](https://classicwuhao.github.io/cyclone_tutorial/expr/check-expr.html) statement, the enumerate statement not only can decide whether a graph has such path **p** but also enumerate them one by one. The enumerate statement cannot work with multiple path lengths as the [check](https://classicwuhao.github.io/cyclone_tutorial/expr/check-expr.html) statement does.

**Note:** the enumerate statement puts Cyclone's compiler on an iteration mode for discovering all possible paths. Each path found by Cyclone is ensured to be unique. Depends on the size of a graph and its transitions, enumeration could be very expensive in terms of memory and CPU usage. Thus, it is recommended to use it when you are aware of available resources (memory, CPU utilization, disk usage, etc.) on a machine.

```cyclone
 enumerate for 12 condition ( (S5->S6->S7)^{3}) reach (S0,S3,S7)
```

The above statement asks Cyclone to enumerate all possible paths and each of them has a length of 12, must have S5->S6->S7 occurred exactly three times and reaches one of the nodes:S0,S3,S7.