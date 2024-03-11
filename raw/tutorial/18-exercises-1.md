---
title: "1.8 Exercises (1)"
prev: "17-path-operator-examples"
next: "19-exercises-2"
order: 10
---

### 1.8 Exercises (1)

#### DFA Exercise 1

Given the following DAF, use Cyclone to find all strings that have a length of 5.

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/exercise1-1.png)



#### DFA Exercise 2

Given the following DFA, use Cyclone to find all strings that have a length of 6 and do not end with a **b**.

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/tutorial_example_1_2.png)

#### DFA Exercise 3

Find all strings such that every string has a length of 6 and **does not end** with a substring abb. You can assume Σ here is: {a,b}. Hint: you need to draw a DFA first,then use Cyclone to find all strings.

#### De-icing Taxiways

During the winter seasons, many major international airports need a service of de-icing their taxiways connecting multiple terminals. Each taxiway has its own direction sign. No airplanes can take off or land during the de-icing process. Typically, de-icing takes sometime to complete and can be very expensive. Hence, many international airports always seek an optimal way of faster de-icing and keeping their cost low at same time.

To find an optimal solution, an airport must compute a route for its **deicer** (a de-icing vehicle) to deice every taxiway. It is quite obvious that the best solution is to **deice every taxiway exactly once (based on its direction sign)**.

For example, the following graph shows a basic layout of a major international airport. Terminal A,B,C,D are passenger terminals. E and F are cargo terminals. The main taxiways are marked as edges in the graph. Each taxiway has its own direction sign. For example, an airplane can move from **Terminal D to B** through taxiway **t1** (but cannot move from B to D). This also applies to a deicer.

Now use Cyclone to help this airport to compute a route for its deicer such that every taxiway gets deiced exactly once.

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/exercise1-2.png)