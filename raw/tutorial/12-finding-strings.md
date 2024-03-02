---
title: "1.2 Finding Strings"
prev: "11-understanding-cyclone-spec-lang"
next: "13-path-conditions"
order: 4
---
### 1.2 Finding Strings

In this section, you will learn how to use Cyclone to find all possible strings with a particular length from a given DFA (deterministic finite automaton). DFA is a state machine and essentially is a graph. So it can be described by Cyclone.

For example, the following DFA describes a machine **M** that accepts strings that start and end with the same symbol.

This example is taken from Introduction to the Theory of Computation (3rd Edition), Page 38, Example 1.11

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/tutorial_example_1_2.png)

The states (**q1** and **r1**) with double circles indicate they are accepting states or final states of **M**.

Suppose we wish to find all possible strings with a length of **5**. We now can write a Cyclone specification for this machine **M**.

The specification is shown below:



```cyclone
machine M {
  abstract start state  S{} 
  abstract final state  q1{} 
  abstract state q2{} 
  abstract final state  r1{} 
  abstract state r2{} 
  transition  t1 { S->q1  on "a" } 
  transition  t2 { S->r1  on "b" } 
  transition  t3 { q1->q1  on "a" } 
  transition  t4 { q1->q2  on "b" } 
  transition  t5 { q2->q1  on "a" } 
  transition  t6 { q2->q2  on "b" } 
  transition  t7 { r1->r1  on "b" } 
  transition  t8 { r1->r2  on "a" } 
  transition  t9 { r2->r1  on "b" } 

  transition  t10 { r2->r2  on "a" } 

  /* 

   * Goal: find all strings with length of 5.

   */  

  goal {
    
    enumerate for 5 
  }

}
```



You must notice that some of the keywords for creating nodes and edges are different from the ones we used in previous Section. This is because some of the keywords are interchangeable in Cyclone specification language. Since we are talking about a DFA machine here, it will make much more sense to consider a node in a graph as a state. Hence, we use keywords [state](https://classicwuhao.github.io/cyclone_tutorial/expr/state-expr.html) and [transition](https://classicwuhao.github.io/cyclone_tutorial/expr/transition-expr.html) instead of [node](https://classicwuhao.github.io/cyclone_tutorial/expr/node-expr.html) and [edge](https://classicwuhao.github.io/cyclone_tutorial/expr/edge-expr.html) used in previous Section. The keywords state and node here are interchangeable. So are edge and transition. In this context, they have the same semantics that is creating nodes and edges in a graph. Similarly, we also change [graph](https://classicwuhao.github.io/cyclone_tutorial/expr/graph-expr.html) to [machine](https://classicwuhao.github.io/cyclone_tutorial/expr/machine-expr.html). By using these keywords, it makes a specification more meaningful in a specific context, particularly when we share it with others. Here is a list of [keywords](https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html) are interchangeable in Cyclone.

The keyword [final](https://classicwuhao.github.io/cyclone_tutorial/expr/final-key.html) here defines a state (node) to be a stopping state or terminating point. In a Cyclone specification, one can define multiple final states but with exactly one [start](https://classicwuhao.github.io/cyclone_tutorial/expr/start-key.html) state. The keyword [on](https://classicwuhao.github.io/cyclone_tutorial/expr/on-expr.html) allows us to label a transition (edge) with a string.

The [enumerate](https://classicwuhao.github.io/cyclone_tutorial/expr/enumerate-expr.html) in goal section asks Cyclone to find all possible paths from a defined starting state (node) to one of the final states (nodes). In previous Section, we used [reach](https://classicwuhao.github.io/cyclone_tutorial/expr/reach-expr.html) statement to check if a node is reachable. Here, we didn't use it since the states **q1** and **r1** are already defined as final states. Both [condition](https://classicwuhao.github.io/cyclone_tutorial/expr/condition-expr.html) (introduced in previous Section) and reach statements are optional for a goal. However, if you have no final states in your machine (graph), then you must supply a reach statement in your goal.

Say, you use a reach statement here to include some states (nodes), Cyclone then will also find path(s) to these states. In this example, our goal is pretty simple just to find all possible strings with a length of 5. We compile this specification, and Cyclone automatically returns the following paths.

- S->r1->r2->r2->r2->r1
- S->r1->r1->r2->r2->r1
- S->r1->r1->r1->r2->r1
- S->r1->r2->r1->r2->r1
- S->r1->r1->r2->r1->r1
- S->q1->q1->q1->q1->q1
- S->q1->q1->q2->q1->q1
- S->q1->q2->q1->q1->q1
- S->q1->q2->q2->q1->q1
- S->q1->q2->q1->q2->q1
- S->q1->q2->q2->q2->q1
- S->q1->q1->q1->q2->q1
- S->q1->q1->q2->q2->q1
- S->r1->r1->r1->r1->r1
- S->r1->r2->r1->r1->r1
- S->r1->r2->r2->r1->r1



For example, the first path is translated to a string "baaab". Here is an exercise, can you use Cyclone to find all possible strings with a length of 5 but only those begin with an **a** ?

#### Tips:

They are multiple ways of doing it. One of the ways is to use the **!** introduced from previous Section.