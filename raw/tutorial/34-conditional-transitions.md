---
title: "3.4 Conditional Transitions"
prev: "33-assertion-and-invariant"
next: "35-checking-modes"
order: 23
---

### 3.4 Conditional Transitions

In this section, we will discuss another important feature in Cyclone that is conditional transition.

#### Conditional Transitions

A conditional transition in Cyclone is a transition that can only happen when a condition is satisfied. With this feature, you can turn conventional an **IF-ELSE** or a **Loop** structure into a conditional transition. This is particularly useful when you want to specify something can only happen under certain conditions.

The semantics of a conditional transition is when a condition is satisfied the transition **must** happen. In other words, the transition never happens if the condition is not met. Here is an example:

```cyclone
 trans { A -> B where x > 0; }
```

The transition A -> B can only be triggered when variable x is greater than 0. Otherwise, the transition could never happen. This is the same as writing an **IF** statement: **IF (x>0) { A-> B }**.

Since a conditional transition can only happen when its condition is satisfied, it can be used to perfectly model an **IF**-**ELSE** statement. Consider the following example:

```cyclone
 trans { A -> B where x > 0; }
 trans { A -> C }
```

The transition A -> C actually can happen when **x <= 0** . This condition is implicitly implied since A -> B can only happen when **x>0**. Hence, the two transitions above is equivalent to the transitions below:

```cyclone
 trans { A -> B where x > 0; }
 trans { A -> C where x <= 0; }
```

#### Non-determinism

Non-determinism naturally exists in Cyclone's language. For example, A can always go to B or C given the following non-conditional transitions.

```cyclone
 trans { A -> B }
 trans { A -> C }
```

For conditional transitions, non-determinism can also be introduced when users specify multiple conditions for one or more transitions. When this happens, Cyclone typically chooses 'the first' satisfied transition. In fact, it is decided by two things. (1) The order of transitions stored internally (2) The underlying solver verifies a condition. For example, the following conditional transitions are non-deterministic.

```cyclone
 trans { A -> B where x > 1; }
 trans { A -> C where x > 2; }
 trans { A -> D where x > 3; }
```

This because when **x=4**, we can always go to B or C or D since each condition here is satisfied. Cyclone most likely picks the transition A-> B. However, you can always control Cyclone to pick the transition that you prefer by simply specify a path condition. Say if you would like to go through transition A->C, then you can add additional path condition: **(A->C)** and Cyclone will always choose the transition A->C.

One might also use [enumerate](https://classicwuhao.github.io/cyclone_tutorial/expr/enumerate-expr.html) command to enumerate all possible satisfied transitions, this is particularly useful when you would like to achieve something like branch or decision coverage for your model.

#### Dead Transition

When one specifies multiple conditional transitions, it is easy to accidentally introduce a special transition called dead transition. Just like its name, a dead transition is a transition never occurs because its condition may never be satisfied. For example, the following conditional transitions introduces a dead transition A->D.

```cyclone
 trans { A -> B where x > 1; }
 trans { A -> C where x <= 1; }
 trans { A -> D }
```

Though the transition A->D does not specify any condition (non-conditional transition), it never happens because the variable x always either satisfies x>1 or x<=1. Hence, Cyclone always chooses either A->B or A->C but never picks A->D. Thus, users need to pay particular attention to the conditions they write. Eliminating dead transitions can reduce the number of conditions Cyclone generates and optimize verification (searching) performance unless one intentionally want to introduce a dead transition.

If you want Cyclone also picks the transition A->D regardless of choosing A->B or A->C, then you can add the following condition to make this transition becomes non-deterministic.

```cyclone
 trans { A -> D where true; }
```

When you enumerate all satisfied transitions, A -> B, A->C and A->D are always chosen by Cyclone.