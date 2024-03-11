---
title: "Initial ()" 
keywords: ["initial"] 
id: "initial"
---

```cyclone
initial(global_variable)
```

The initial expression refers to the initial state of a variable before entering a starting state. The variable here must be (semantically) legal and declared as a graph-scope variable.

The initial expression can be used in the goal or a node/state section. The initial expression specifies the state of a variable before entering a starting state/node.

```cyclone
machine swap { 
  int a;
  int b;
  int t;

  start normal state S0 {t=a;}
  normal state S1 {a=b;b=t;}
  
  transition  t1 {S0->S1}
  transition  t2 {S1->S0}
  
  goal  { 
    assert  (a==initial(b) && b==initial(a)); 
    check for 1 reach (S1) 
  }
} 
```

The above specification asks Cyclone to verify a swap function: swap values of variable a and b. The initial(a) refers to the initial state of variable a before entering the starting state S0.