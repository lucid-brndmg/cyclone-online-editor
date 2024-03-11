---
title: "1.7 Path Operator Examples"
prev: "16-summary"
next: "18-exercises-1"
order: 9
---

### Path Operator Examples

Many constraints on a path can be expressed using Cyclone's path operators. Understanding Cyclone's path operators is the key to express the kinds of constraints you want to capture. In this Section, we show a few examples of some of the path operators and their semantics.

#### Definition:

Given a path condition **c**, Cyclone discovers a path **p** that provably satisfies **c**.

#### Example 1.

```cyclone
 condition ( S1->S2->S3 )
```

The path condition in Example 1 means that **S1->S2->S3** is a subpath that can appear anywhere in a path to be discovered (by Cyclone). In other words, a path **p** must include **S1->S2->S3**.

#### Example 2.

```cyclone
 condition ( S1 && !S2 )
```

This path condition specifies a compound path condition that contains two path conditions: **S1** and **!S2**. Hence, this condition means that **p** must include node **S1** and exclude **S2**. Note that operator **!** denotes exclusion, though it looks the same as logical not operator.

#### Example 3.

```cyclone
 condition ( Sx->_->Sy )
```

This condition uses an any one operator(**_**) to indicate a subpath that from **Sx** must go through one node to **Sy**. But we don't know which one. This depends on the node picked by Cyclone and the connections between **Sx** and **Sy**. Given the following part of a graph, **any one operator means** it could be any one of these nodes: **S0,...,Si,Si+1,Si+2,...Sn**.

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/anyone_example.png)

Hence, the above condition is equivalent to the following:

```cyclone
 condition ( Sx->S0->Sy || Sx->Si->Sy || ... ||Sx->Sn->Sy )
```

#### Example 4.

```cyclone
 condition ( (S1->S2->S3)^{1:3} )
```

The above path condition specifies **S1->S2->S3** must occur between 1 and 3 times (inclusive) in **p**. Path operator **^{i:j}** (postfix operator) can be applied to a node and a path. However, this operator requires parentheses for a path. For example, the following condition:

```cyclone
 condition ( S1^{2}, S1->S2->S3^{1:3} )
```

Ths first condition specifies node **S1** must occur exactly twice in **p**. The second condition is illegal. The current version of Cyclone cannot recognize such usage.

#### Example 5.

```cyclone
 condition ( >>(S1->S2->S3) && <<(S1->S2->S3) )
```

The condition above uses both place operator (prefix): >> and <<. Place operator allows users to specify an exact location that a node or a path can appear in **p**. Operator >> calculates location from left to right, and << does it from right to left. The exact location in **p** is specified using an index value starting from 0 to n where n is the length of **p** (|p|). In the case when there is no index value specified, the default value 0 is used. The following diagrams illustrate >> and <<.

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/place_operator_1.png)

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/place_operator_2.png)

The index value(s) are specified using subscripts. **S1** has an index value of 1. For a node, the valid index ranges from **0** to n. For a path **s**, the valid index values depend on the length of **s**. For example, let **|p| = 6** and **s** be X->Y. The maximum index value can go is 5, since |s| is 2.

Any values beyond that is illegal. The following diagram illustrates this example.



![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/place_operator_example.png)

Hence, our path condition requires Cyclone to find a **p** that starts and ends with the same subpath: S1->S2->S3

#### Example 6.

```cyclone
 condition ( >>2(S1->S2->S3) && (S1->S2->S3)^{3} )
```

The above compound path condition specifies that S1->S2->S3 must start at third node in **p** and it must occur (in p) three times. In this case, you can take an advantage of using both prefix and postfix operators and merge them into one single path condition.

```cyclone
 condition ( >>2(S1->S2->S3)^{3} )
```

#### Exercises

Determine the semantic validity of each of the following path condition. If a condition is valid, explain its meaning in English

```cyclone
1: condition ( S1^{1:2} && (S4->S5) || S5->!S6 )
2: condition ( S1->_->_->S1 || (S1->S1)^{2:4} )
3: condition ( >>3(S3->_->S7)^{2:4} )
4: check for 6 condition ( >>(S1->S2)^{2} || <<2(S5->S6)  )
5: check for 6 condition ( >>6(S3->S4) || !(S3->S4)^{2}  )
6: check for 7,8,9 condition (>>(_->_->S5), S5^{3})reach(S1,S2,S3)
7: check for 7 condition (<<6(S2->S3),S1^{2:3}^S4^S5,!(!S5))reach(S1,S2)
```