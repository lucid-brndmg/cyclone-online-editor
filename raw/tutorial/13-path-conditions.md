---
title: "1.3 Path Conditions"
prev: "12-finding-strings"
next: "14-finding-hamiltonian-path"
order: 5
---

### 1.3 Path Conditions

In previous Sections, you may have already seen some of the path conditions. In this Section, we will learn path conditions and how to use them. In Cyclone's specification language, **path operators** are operators that can be used for expressing the kind of path(s) you would like Cyclone to find. Informally speaking, path(s) that are constrained with **path operators** forms path(s) to be discovered by Cyclone. We consider such constrained paths as **path conditions** in Cyclone's specification.

A path condition can use path operators to constrain a node or path. A path condition is a kind of path expression only cares about how nodes and edges are constrained. For example, both **S1->S2->S3** and **!(S4->S5)** are path conditions.

In a Cyclone specification's goal section, the condition statement can specify one or more path conditions. Each path condition can be logically joined using standard logical operators to form a compound path condition.

Here, we show you the following three types of path operators. For more operators please see [here](https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html).

- **Type 1:** Inclusion/Exclusion of a node/path
- **Type 2:** Partial path indicator
- **Type 3:** Number of occurrence of a node/path

#### 1.3.1 Type 1

To specify a particular node or subpath to be included in a path to be found, we can just use the name of a node or path operator (->). For example, the following condition statement specifies two path conditions on a path to be discovered. That is the path (to be discovered by Cyclone) must go through a node **S3** and must not include a subpath **S2->S3**.

```
condition (S3, !(S2->S3)) 
```

You can specify multiple path conditions in a [condition](https://classicwuhao.github.io/cyclone_tutorial/expr/condition-expr.html) statement and use comma to separate each of them. All the path conditions in a [condition](https://classicwuhao.github.io/cyclone_tutorial/expr/condition-expr.html) statement are logically anded.

#### 1.3.2 Type 2

In some cases, you may only know some parts of a path you are looking for or a set of paths that has the same properties. For example, the following condition



Condition 1: a set of path(s) that has a length of **5** and begins and ends at node **S1** .

In Cyclone's language specification, we can use a path operator named [any one](https://classicwuhao.github.io/cyclone_tutorial/expr/anyone-op.html). The any one operator is denoted as **_** (underscore). It essentially means that any node in a graph as long as it can form a valid path. With **_**(any one) operator, we now are able to describe Condition 1 as follows:

```
condition  (S1->_->_->_->_->S1) 
```

Similarly, the following condition describes a set of path(s) that has length of **4** with node **S1** in the middle.

```
condition  (_->_->S1->_->_) 
```

#### 1.3.3 Type 3

The third type of path operator allows us to specify [the number of occurrence](https://classicwuhao.github.io/cyclone_tutorial/expr/occur-op.html) of a node or path. For example, Finding Hamiltonian path problem in [Chapter 0](https://classicwuhao.github.io/cyclone_tutorial/chapter1/tutorial.html) requires all nodes in a graph to be visited exactly once. When this kind of scenarios come up, we can use **^{i:j}** path operator to limit the number of occurrence of a particular node or path. For example,

```
condition  (S1^{1:3}) 
```

this condition means that the node **S1** can only appear in a path between **1** and **3** times.

**^{i:j}** specifies a lower bound **i** and an upper bound **j**. This operator can be applied to both a node and a path. If only a lower bound **i** is specified, then this means exactly **i** times. For example, the following condition specifies a path **S1->S2** can only occur exactly twice.

```
condition  ( (S1->S2)^{2} ) 
```

#### Compound Path Conditions

Multiple path conditions can be joined as a compound path condition by using standard logical operators. In Cyclone, logical operators are the same as those are commonly used in other programming languages. The following list outlines supported logical operators in Cyclone.

- **&&**: logical and
- **||**: logical or
- **^**: logical xor
- **!**: logical not

For example, the following condition is a compound path condition:

```
condition  ( !(S1->S3) && ( _->S4->_ || S5^{1:3}) ) 
```

The above compound path condition contains three path conditions.