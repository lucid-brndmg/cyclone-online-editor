---
title: "abstract"
keywords: ["abstract"]
id: "abstract"
---

abstract is a modifier in Cyclone.

##### Description

The keyword abstract is used to declare a node. A node with abstract modifier indicates that this node does not contain information such as variable declarations and expressions. The compiler treats an abstract node as a pure node (does not contain any other information) in a graph, ignores all the expressions enclosed between { and }.

```cyclone
 abstract node  S0 { 
      int s0_counter=0;//ignored by the compiler
      global_counter++;//ignored by the compiler
 } 
```

By default, a node in Cyclone specification is abstract. If you wish to use variables and expressions within a node, then a node must be declared with [normal](https://classicwuhao.github.io/cyclone_tutorial/expr/normal-key.html) modifier.