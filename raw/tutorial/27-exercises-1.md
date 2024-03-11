---
title: "2.7 Exercises (1)"
prev: "26-model-checking"
next: "28-exercises-2"
order: 18
---

### 2.7 Exercises (1)

#### Second Solution

Use Cyclone to find the second solution to [the defuse bomb problem](/tutorial/23-defuse-a-bomb). Hint: you need to use path conditions to eliminate non-meaningful actions such as Fill Jug1 -> Empty Jug1 -> Fill Jug1.

#### Verifying Programs

Use Cyclone to prove the validity of the following programs (don't forget you need to specify a loop invariant). In all programs below, the variables type are integers.

```
// Program 1
    [x >=0]
    a = x;
    y = 0;
    while (a!=0){
        y = y + 1;
        a = a - 1;
    }
    [x = y]
```

The precondition here is **x>=0** and postcondition here is **x=y**

```
// Program 2
    [y=y0 ∧ y >=0]
    z = 0;
    while (y!=0){
        z = z + x;
        y = y - 1;
    }
    [z = x * y0]
```

The precondition here is **y=y0** ∧ y >=0; and postcondition here is **z = x \* y0**

```
// Program 3
    [x>=0]
    y = 0;
    while (y!=x){
        y = y + 1;
    }
    [x = y]
```

The precondition here is **x>=0** and postcondition here is **x = y**