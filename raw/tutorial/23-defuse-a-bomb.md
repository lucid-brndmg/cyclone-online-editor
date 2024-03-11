---
title: "2.3 Defuse a Bomb"
prev: "22-proving-zero-sum-game"
next: "24-program-verification"
order: 14
---

### 2.3 Defuse a bomb

In the movie [Die Hard with a Vengeance](https://www.imdb.com/title/tt0112864/) where Bruce Willis and Samuel L. Jackson have to defuse a bomb by placing a 4 gallon jug of water on a set of scales. They only have a 3 gallon jug and a 5 gallon jug. Both of them don't have markings. They must use two jugs to get **precise** 4 gallon jug of water before the bomb go off.

How do we solve this challenge with Cyclone ?

In a simple sentence, Cyclone can solve this problem in a pretty neat way. We just need to model different states of actions. There is a list of possible 6 actions for Bruce Willis and Samuel L. Jackson can perform:

- 1. Pour 3 gallon water jug into 5 gallon water jug.
- 2. Pour 5 gallon water jug into 3 gallon water jug.
- 3. Empty 3 gallon jug.
- 4. Empty 5 gallon jug.
- 5. Fill 3 gallon jug.
- 6. Fill 5 gallon jug.

Each action can be followed by another. Thus, our goal here is to discover a sequence of actions that eventually make 5 gallon jug containing precise 4 gallon amount of water. We can analyze each action (listed above) and write Cyclone specification for each action. Let's start some simple actions. For example, action 3 simply just empties 3 gallon jug. We can build the following state to model this action:

```cyclone
normal state EmptyContainer1{ 
    container1=0; 
}
```

Here, we use a variable **container1** to denote the amount of water in our 3 gallon jug. Further, we can define a state for action 5 that fills 3 gallon jug.

```cyclone
normal state FillContainer1{ 
    container1=3; 
}
```

We set **container1** to 3 to denote that 3 gallon jug is full. Similarly, we can build two states for the action 4 and 6.

```cyclone
normal state EmptyContainer2{ 
    container2=0; 
}
normal state FillContainer2{ 
    container2=5; 
}
```

We use two variables **container1** and **container2** to represent the amount of water in 3 gallon jug and 5 gallon jug. We observe that no matter what actions we take, the amount of water in 3 gallon jug is always bounded between **0** and **3** gallon. This is the same for 5 gallon jug. That is the amount of water always stays between 0 and 5 gallon. In a situation like this, we can use a **where** clause to specify this condition when declaring these two variables.

```cyclone
int container1 where container1>=0 && container1<=3;
int container2 where container2>=0 && container2<=5;
```

A **where** clause can specify a condition that a variable must meet. Here we limit the range of a variable. This is slightly different from the [invariant](https://classicwuhao.github.io/cyclone_tutorial/expr/invariant.html) statement we have learned from previous section. For an invariant, it may not hold during the computation but it must hold before or after computation (in a state). However, for a condition is specified with **where**, the condition must hold before, during and after the computation. Hence, **where** is more strict than [invariant](https://classicwuhao.github.io/cyclone_tutorial/expr/invariant.html).

The tricky part here is how to model action 1 and 2: pour water from 3 gallon jug into 5 gallon jug and vice versa. Let's analyze action 1:

In order for 5 gallon jug to receive some water from 3 gallon jug, we must ensure 5 gallon jug is not full. In other words, we have to prevent the jug from **overflow**.

On the other hand, if we cannot fill 5 gallon jug with amount of the water in 3 gallon jug, then we are ensured that the jug is not overflown. Hence, there are two cases here:

- Case 1: 5 gallon jug overflows after pouring water from 3 gallon jug.
- Case 2: 5 gallon jug does not overflow after pouring water from 3 gallon jug.

For case 1, we need to calculate the right amount of water to fill 5 gallon jug. For case 2, we can just safely pour all the water from 3 gallon jug to 5 gallon jug. Thus, we use the following Cyclone code to capture these two cases:

```cyclone
// Pour water from 3 gallon jug to 5 gallon jug 
normal state Con1ToCon2{ 
    (container1 + container2 > 5) => (amount == 5 - container2);
    (container1 + container2 <= 5) => (amount == container1);
}
```

Here, the operator **=>** means implication. The variable **amount** denotes the amount of water can be poured from 3 gallon jug. Implication (**=>**) in Cyclone only works with boolean conditions, and this forces Cyclone compiler to compute the correct amount of water in order to make conditions hold.

It is obvious that the amount of water can be poured must stay between 0 and 3 (decided by the smaller gallon jug.). Thus, we can also constrain our variable **amount** in the following way:

```cyclone
// amount of water can pour from one jug to the other 
int amount where amount>=0 && amount<=3;
```

Since the amount of water poured to a jug could be different every time for action 1 and 2, there is no need to keep track this number as long as both of jugs do not overflow. To do this, we use a [fresh](https://classicwuhao.github.io/cyclone_tutorial/expr/fresh.html) statement. Hence, our final specification for action 1 is as follows:

```cyclone
// Pour water from 3 gallon jug to 5 gallon jug 
normal state Con1ToCon2{ 
    fresh(amount);
    (container1 + container2 > 5) => (amount == 5 - container2);
    (container1 + container2 <= 5) => (amount == container1);
    container1 = container1 - amount;
    container2 = container2 + amount;
}
```

The [fresh](https://classicwuhao.github.io/cyclone_tutorial/expr/fresh.html) statement asks Cyclone compiler to create a new fresh variable every time a node/state is visited in a path (to be discovered), and we do not need to keep track of its value. This fresh variable retains amount's type and condition imposed by where clause. In short, you can think this fresh variable as a copy of amount but may have a different value every time the state Con1ToCon2 gets visited. Hence, we are now guaranteed that every time action 1 is performed, a different amount of water can be poured.

We can write a similar specification for action 2 (pour water from 5 gallon jug to 3 gallon jug).

```cyclone
// Pour water from 5 gallon jug to 3 gallon jug 
normal state Con2ToCon1{ 
    fresh(amount);
    (container1 + container2 > 3) => (amount == 3 - container1);
    (container1 + container2 <= 3) => (amount == container2);
    container1 = container1 - amount;
    container2 = container2 + amount;
}
```

At the beginning, both jugs are empty.

```cyclone
start normal state Start{ 
    container1 = 0;
    container2 = 0;
}
```

Next, we build the connections among all possible actions.

```cyclone
trans t1 { Start -> Con2Con1 }
trans t2 { Start -> Con1Con2 }
trans t3 { Start -> FillContainer1 }
trans t4 { Start -> FillContainer2 }
trans t5 { Start -> EmptyContainer1 }
trans t6 { Start -> EmptyContainer2 }
// ...
// ...
// ...
trans t36 { FillContainer2 -> FillContainer1 }
```

Finally, we write our goal section to ask Cyclone find a path that can make our 5 gallon jug containing precise 4 gallon water.

```cyclone
goal { 
    assert (container2==4);
    check for  2,3,4,5,6 
      reach (Con1ToCon2,Con2ToCon1,EmptyContainer1,
        EmptyContainer2,FillContainer1,FillContainer2)
}
```

Here, we check for a solution between 2 and 6 actions. Compile this specification, Cyclone successfully finds a sequence of actions (shown below 6 actions) to get 4 gallon water and thus we can now defuse the bomb.

**Start->FillContainer2->Con2ToCon1->EmptyContainer1->Con2ToCon1->FillContainer2->Con2ToCon1**

The complete specification can be downloaded [here](https://classicwuhao.github.io/cyclone_tutorial/chapter2/defuse_bomb.cyclone). In fact, 6 here is the minimum number of actions required. However, can you use Cyclone to find all other solutions? [Here is the video.](https://www.youtube.com/watch?v=2vdF6NASMiE)