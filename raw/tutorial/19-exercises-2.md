---
title: "1.8 Exercises (2)"
prev: "18-exercises-1"
next: "21-a-simple-counting-machine"
order: 11
---

### 1.9 Exercises (2)

#### Package Installation Problem

A software company is about to release a set of new version of packages: **T0,T1,T2,T3,T4,T5,T6**. These packages will be used as a patch to an existing trading system (for stock market). A trading system cannot be shutdown or rebooted for installation and it has to keep business running 24x7. Hence, a hotpatch installation is required.

In order to apply a hotpatch, the key here is to find the correct order of installing these packages. Before the release, this company need to test every correct installation sequence to ensure zero crash. However, there are some rules a correct installation sequence must obey:

- 1. Package T1 must be installed first
- 2. Package T3 must be installed immediately after T4 installation.
- 3. Package T5 must be installed **before** T2. (Install package T2 before installing T5 will crash entire system.)
- 4. Each package must be installed exactly once.
- 5. It does not matter which package will be installed at the end.

For example, T1->T6->T5->T4->T3->T2->T0 is a correct installation sequence. Now write a correct Cyclone specification to help this software company to find all possible (correct) installation sequences of these packages. You may use Cyclone's new [features](https://classicwuhao.github.io/cyclone_tutorial/expr/anonymous-edges.html) to further simplify your specification.

#### Fuel Supply Planning

A drone is about to be programmed to send some fuel supply to each station (in a sector) so that robots in each station can have enough fuel to consume. The layout of current sector is shown below. This sector has 7 stations (A,B,C,D,E,F,G) and each one is connected through some tunnels. A drone must travel through these tunnels to send fuel to a station. Each tunnel is marked with a direction sign. For example, a drone can directly travel from station A to station D through tunnel t1. However, it cannot directly go from station D to station A.

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/exercise2-2.png)

Typically, **a drone should start from one station (starting station), finish its fuel delivery (to all other stations) and back to the starting station**. In other words, the starting station and finish station are the same. Due to the fuel shortage, **each station can only be visited exactly once except for the starting station**. For example, A->G->D->E->F->B->C->A is a valid way for a drone to send fuel to each station. Now, use Cyclone to find all possible ways that a drone can deliver fuel.