---
title: "1.5 Planning Route for an Agent"
prev: "14-finding-hamiltonian-path"
order: 7
---

### 1.5 Planning Route for an Agent

In previous Section, we have learned how to use Cyclone to solve Hamiltonian path problems. The specification showed in previous section is not a unique solution, there are many ways of writing a Cyclone specification to a specific solution.

In this Section, we will show you another interesting problem that can be solved by Cyclone. This problem is known as route planning for an agent. Suppose we have an agent that is waiting to be programmed to pick a package at a specific location and deliver it to a customer's house. In order to successfully deliver a package to a destination, an agent must obey the following rule

```
Condition: An agent must avoid walls on it's way to its destination.
```

This problem can be visualized using following diagram.

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/planning.png)

Given a grid, an agent (marked as orange color) must pick up a package (green color) and deliver it to a destination (blue color). The gray areas in the grid are walls an agent must avoid.

To make this problem much simpler, we say an agent can only move forward and downward. To solve this problem, we could turn a grid into a graph and specify the correct condition for Cyclone.

We convert each cell in a grid into a node, and use edges to connect adjacent cells. So eventually we have the following graph:

![img](https://classicwuhao.github.io/cyclone_tutorial/chapter1/planning_graph.png)

In the graph above, **S0** is a starting point of our agent, **S24** is the destination, and **S13** is the package to be picked up by our agent. Nodes with gray background are walls. Since we only allow agent to travel either forward or downward, we do not include edges for agent to move backward or upward. But in the real world, you could create these edges. Here, we exclude these edges just for simplicity purpose.

This graph can be easily turned into a Cyclone specification. To capture the condition for our agent to avoid walls, pick up a package and deliver it to the destination, we create a goal section in our Cyclone specification. In this case, we know that the path length cannot exceed **8**, since our agent can only move forward and downward and the destination is located at node **S24** . For the condition, we just need to exclude nodes marked as walls and must include a subpath to node **S13** where our package is. Eventually, it should reach our destination node **S24** .

Hence, our goal section is as follows:



```
goal{ 
  check for 8 condition ( 
    (!S7 && !S11 && !S12), 
    (!S18 && !S23), 
    (_->S13->_) ) 
    reach (S24)
}
```

Compile this specification along with our path conditions, Cyclone successfully finds a path for our agent.



**S0->S1->S2->S3->S8->S13->S14->S19->S24**

### Tips:

Do you know you can use check to check multiple path lengths? You just separate each path using a comma. See the following example:

```
 check for 8, 9, 10 condition ( ... ) ...
```

This allows Cyclone to check whether path length 8, 9, or 10 will have a solution (to the condition) or not.

See [here](https://classicwuhao.github.io/cyclone_tutorial/expr/check-expr.html) for more details about multiple path lengths

### 1.5.1 Practice.

- Expand our grid to a 8x8 grid and add a second agent anywhere on the grid
- Make our agents can move backward and upward.
- Add a second package, and a second destination for our second agent
- Make sure two agents deliver packages to their destination without crossing each other.