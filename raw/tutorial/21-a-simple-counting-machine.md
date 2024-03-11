---
title: "2.1 A Simple Counting Machine"
prev: "19-exercises-2"
next: "22-proving-zero-sum-game"
order: 12
---

# Chapter 2: Building Simple Models

In Chapter 1, you have learned how to write a basic Cyclone specification and use path conditions to find the path you want. In this Chapter, you will learn how to program with Cyclone and use Cyclone to check whether a model is correct.

### 2.1 A Simple Counting Machine

In a Cyclone specification, one can write conventional code. Just like Java or C code, you can declare variables and perform some computation. Let's start with a very simple machine. Suppose you want to build a counting machine. This machine keeps a counter in memory and can execute three kinds of instructions:

- 1. RESET: reset our counter to 0.
- 2. INC: increment our counter by 1.
- 3. DEC: decrement our counter by 1.

Each instruction can be followed by another to form an **instruction sequence**. For example, after executing the following instruction sequence our counter is 1

```
RESET
INC
DEC
INC
```

At the beginning, we say our counter is reset to 0 and then our counting machine starts to execute. So our counting machine can be represented as the following state machine.

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter2/counter.png)

We use a variable **c** to represent our counter. State **R** is our reset state. State **I** simply increments our counter by 1. State **D** decrements our counter.

To model this counting machine, we now can write conventional code inside a Cyclone specification. For example, the following specification models our counting machine.

```cyclone
machine Counting { 
    int  c;
    start normal state  R {c=0;} 
    normal state  I {c=c+1;} 
    normal state  D {c=c-1;} 
    transition  t1 { R -> I } 
    transition  t2 { R -> D } 
    transition  t3 { I -> R } 
    transition  t4 { I -> D } 
    transition  t5 { I -> I } 
    transition  t6 { D -> R } 
    transition  t7 { D -> I } 
    transition  t8 { D -> D } 
} 
```

In the specification above, we declare an integer type variable **c** as our counter. This variable can be accessed or updated by any state(s) defined in the specification. Thus, our states **I** and **D** increment/decrement our counter respectively. The modifier normal enables a node or state to contain conventional code. **If a state or node does not use the modifier normal, then all the code it contains is ignored by Cyclone compiler. So make sure you check your state modifier before launching Cyclone's compiler.**

Now suppose we want to find out **all** possible instruction sequences that can make our **counter=3** using **6** instructions. Further, we also would like to cover instruction **DEC**.

So we add the following goal section into our current Cyclone specification:

```cyclone
goal{ 
    assert c==3;
    enumerate for 5 condition ( D ) reach (R,I,D)
}
```

The [assert](https://classicwuhao.github.io/cyclone_tutorial/expr/assert.html) statement allows us to specify a **content condition** that must be fulfilled. In general, a **content condition** is an expression that specifies the kind of conditions must be met when Cyclone successfully discovers a path. This condition together with our **path condition (must cover DEC)** and [reach](https://classicwuhao.github.io/cyclone_tutorial/expr/reach-expr.html) statement forms the final conditions. Cyclone solves the conditions and returns the following instruction sequences:

- R->I->I->D->I->I
- R->I->D->I->I->I
- R->I->I->I->I->D
- R->I->I->I->D->I
- R->D->I->I->I->I
- R->D->R->I->I->I

Note that [assert](https://classicwuhao.github.io/cyclone_tutorial/expr/assert.html) must specify a boolean expression. A goal section can contain multiple assert statements.
