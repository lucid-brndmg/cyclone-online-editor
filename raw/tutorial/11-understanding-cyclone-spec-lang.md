---
title: "1.1 Understanding Cyclone"
prev: "02-installation"
next: "12-finding-strings"
order: 3
---

# Chapter 1: Fundamental

### 1.1 Understanding Cyclone's Specification Language

In this Chapter, you will learn and understand how to write a valid Cyclone specification and use Cyclone to solve some interesting problems from graph theory. In general, you can use Cyclone's language to model a (directed) graph. The overall structure of a Cyclone specification is quite straightforward and we will walk you through an example to explain some of the features from Cyclone's specification language.

Let's just start with a simple graph specification called **G** . This specification models a graph that is shown below. This graph contains only two nodes and they are all connected to each other.

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/tutorial_example_1.png)

The following code section shows a Cyclone specification that captures this graph.

```cyclone
graph G { 
    abstract start node  S1 {} 
    abstract node  S2 {} 
    edge  t1 { S1 -> S1 } 
    edge  t2 { S1 -> S2 } 
    edge  t3 { S2 -> S1 } 
    edge  t4 { S2 -> S2 } 
    goal{ 
        check for 5 condition (!(S1->S1) && !(S2->S2)) reach (S2)
    }
} 
```

The keywords in this specification are marked in blue (orange in dark mode) color. Let's break down this specification sections by sections and explain each section. The first section is for creating nodes. First, we use the keyword graph to specify a graph to be defined. Then the following code

```cyclone
    abstract start node  S1 {} 
```

creates an empty node named **S1** in our graph **G**. The keyword abstract is a **modifier** tells the node **S1** does not contain other information. The keyword start is another **modifier** that tells a starting point for Cyclone to begin to search for a **goal**.

The next section is for creating edges. The edge statement can create a single edge in a graph. For example, we create an edge named **t2** that allows us to move from node **S1** to node **S2**.

```cyclone
    edge  t2 { S1 -> S2 } 
```

Next, we have a **goal** section to tell Cyclone the kind of path(s) to be found. Here is our goal:

```cyclone
goal{ 
    check for 5 condition (!(S1->S1) && !(S2->S2)) reach (S2)
}
```

The keyword check tells Cyclone to find one path, for 5 defines the length of a path to be found. The keyword condition here specifies a path condition to be met. In this case, our condition is

```cyclone
    !(S1->S1) && !(S2->S2)
```

This condition requires the path to be found by Cyclone **must not** include self-loops. ! is a **path operator** that can be used to exclude a specific path or node from a path.

The reach statement reach (S2) tells Cyclone to check whether such path can reach node **S2**.

Hence, this goal asks Cyclone to find a path (starts from node **S1**) that has a length of 5, must not include self-loops and eventually reaches **S2**.

If you compile this specification with Cyclone, and it automatically finds a path: S1->S2->S1->S2->S1->S2 .

#### Tips:

In general, the most basic Cyclone specification typically has three sections: a node section, an edge section and a goal section. In addition, a start node must also be specified in the node section.