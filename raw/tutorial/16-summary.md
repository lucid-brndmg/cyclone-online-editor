---
title: "1.6 Summary"
prev: "15-planning-route-for-an-agent"
next: "17-path-operator-examples"
order: 8
---

### 1.6 Summary

In this Section, we summaries the fundamental features of Cyclone specification language.

#### Specification Structure

Overall, a Cyclone specification contains three sections (current version): node section, edge section and goal section. The goal section is optional. If there is no goal section defined, Cyclone will not compile the specification. But it is still a valid specification.

There are four modifiers can be used for specifying a node.

- **[abstract](https://classicwuhao.github.io/cyclone_tutorial/expr/abstract-key.html)**: a node with abstract modifier cannot contain other information such as variables or expressions.
- **[start](https://classicwuhao.github.io/cyclone_tutorial/expr/start-key.html)**: a node with start modifier specifies an entry point for Cyclone to discover a path defined in a goal section. Only one start node can be specified.
- **[normal](https://classicwuhao.github.io/cyclone_tutorial/expr/normal-key.html)**: a node can contain information such as variables and expressions.
- **[final](https://classicwuhao.github.io/cyclone_tutorial/expr/final-key.html)**: a node marked final modifier is a node to be reached by a path to be discovered. Multiple final nodes can be defined. The set of final nodes will be unioned with the nodes specified in a reach statement.

It is illegal to use abstract and normal together. It is legal to use start and final together. By default, a node is abstract.

The keyword edge is for creating an edge in a graph. An edge can be labelled with a string via using label keyword. A where clause can be used on an edge to specify a guard on a transition (not available in the current version).

#### Goal Section

A goal has the following syntax:

```
(check | enumerate)  for  Integer+ 
    (condition (PathCondition1,PathCondition2,...,PathConditionn))?
    (reach (Node1,Node2,...,Noden))?
```

Both condition and reach statements are optional for a goal. If there is no reach statement specified, Cyclone will discover a path that reaches one of the nodes with final modifier. If there is a reach statement and some final nodes defined in node section, then Cyclone will discover a path that reaches one of the union of two sets of nodes.

All path conditions specified in a condition statement are logically conjoined. One can use a single compound path condition to form logical disjunction as follows:

```cyclone
      condition ( 
                PathCondition1 || PathCondition2 || 
                ... || PathConditionn)
```

#### Path Operators

Wisely use path operators can help Cyclone to find path(s) you want. However, there are some common pitfalls of using some of the path operators.

Operator **!** **cannot** be applied to a node in a path, but can be applied to an entire path. Thus, the following code is illegal.

```cyclone
!S1->S2 
```

If you would like to exclude S1->S2, then use

```cyclone
!(S1->S2) 
```

If you just want to say exclude **S1** along in this path, then use

```cyclone
!S1 
```

Operator **^{i..j}** can be applied to both a node or an entire path, but not a node in a path. For example, the following is illegal

```cyclone
S1->S2^{3}->S3->...
```

If you wish to say node **S2** must appear three times before node **S3** in this path, then you can just use

```cyclone
S1->S2->S2->S2->S3->...
```

However, if you wish to say node **S2** must appear three times and include this path as well, then you use

```cyclone
S2^{3} && S1->S2->S3->...
```

If you want to find a path that has a length ranging from **i** to **j**, you can construct a compound path condition by using logical disjunction. For example, all path(s) with length from **3** to **5** begins and ends with **S1**, you could construct the following compound path condition:

```cyclone
(S1_->_->_->S1) || (S1_->_->_->_->S1) || (S1_->_->_->_->_->S1)
```