---
title: "edge"
keywords: ["edge", "trans", "transition"]
id: "edge"
---

The edge statement allows you to declare an edge in a graph.

##### Syntax

The syntax of an edge statement is as follows:

```cyclone
 [edge|trans|transition] [name] { <path expression> [where <condition> ]} [label/on string]
```

An edge in a graph must be declared with an edge statement. A path expression is an expression that specifies a link between two nodes. The arrow '->' is used to specify the direction from one node to another. The keyword label/on can specify a string that describes an edge. The keyword where specifies a transition guard. The name here is optional if [anonymous edge](https://classicwuhao.github.io/cyclone_tutorial/expr/anonymous-edges.html) is enabled.

```cyclone
 edge t1 {S1->S2} label "switch is on" 
```

`S1->S2` is a path expression.

##### Scope

Once an edge is declared, a link in a graph is established. An edge must use the nodes that are declared in the [node](https://classicwuhao.github.io/cyclone_tutorial/expr/node-expr.html) section.

##### Semantics

Each edge that is declared in edge section is compiled by Cyclone into a path condition along with other conditions that can be solved by an SMT solver. The keyword label/on can be used to specify a string over an edge. However, the compiler ignores this string and it doesn't get compiled into a path condition.

An edge can also be declared as a conditional edge (transition) through a [where](https://classicwuhao.github.io/cyclone_tutorial/expr/where.html) clause.

#### Short-handed Notations

Creating a edge at a time is tedious. In Cyclone, users can use short-handed notations to create a set of different edges a time. In the current version of Cyclone, we provide the following short-handed notations for creating a set of edges.

##### 1. Bidirectional Transition (edge)

Notation: `A <-> B`

creates two transitions from node A to B and vice versa.

##### 2. Closure

Notation: `A -> *`. For each node in a graph, create a transition from A including A itself.

##### 3. Positive Closure

Notation: `A -> +`. For each node in a graph, create a transition from A exclude A itself.

##### 4. Exclusion List

Users can also use an exclusion list to specifically exclude a list of nodes.

Notation: `[N1,N2,...,Ni]`.

`A -> + [B,C]`. Create an edge from A to every node in the graph except for node A, B and C.

##### Some examples

- `A -> * [B]` create edges from A to every node in the graph except for B.
- `A -> + where x >0;` create conditional transitions from A to every node in the graph except for A. For each transition created, the condition x≥0 must be satisfied in order to make a transition from A to other nodes.