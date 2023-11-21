---
title: "0.1 What is Cyclone"
prev: "_default"
next: "02-installation"
order: 1
---

# Chapter 0: What is Cyclone ？

What is Cyclone? What can it do? Before revealing all features about Cyclone, let's begin with a classic and commonly known problem in graph theory.

## Introduction - A Classic Graph Problem

In graph theory, a **[Hamiltonian path problem](https://en.wikipedia.org/wiki/Hamiltonian_path_problem)** is about deciding/finding whether a (directed/undirected) graph contains a Hamiltonian path.

So what is a Hamiltonian path?

Here is an informal explanation, a Hamiltonian path is a path that covers **all** the vertices of a graph **exactly once**.

Finding a Hamiltonian path in a graph is challenging. In fact, it is [NP-complete](https://en.wikipedia.org/wiki/NP-completeness) and this means we can verify the correctness of a solution quickly but takes much more time (than verifying a solution) to find a solution.

For example, does the following graph have a Hamiltonian path? If it has, how many does it have ?



![img](https://classicwuhao.github.io/cyclone_tutorial/introduction/hamilton.png)

Well, you could write a brute-force search algorithm to find all solutions to the condition: covers all the vertices of a graph exactly once. However, what happens if we have another graph with different conditions to be met such as a path must include multiple cycles or even for some nodes or edges (not) to be appeared a number of time. You certainly don't want to write a new algorithm every time when a condition is added, changed or removed. More importantly, how can you ensure the correctness of your algorithms.

In our daily life, many problems can be represented as a graph such as a puzzle, a computer program or a free-falling ball.

Cyclone is designed to provide a general solution to problems that can be described as a graph. Cyclone provides a specification language that allows users to describe a graphical structure along with conditions to be met and automatically solves them for you. More importantly, as long as conditions are correctly specified the correctness of returned solutions are ensured. Problems like finding Hamiltonian path in the graph above can be easily turned into a Cyclone specification and solved by Cyclone's powerful algorithms. We will come back to this problem in a later Section.

Want to try Cyclone? just click [Here >](https://classicwuhao.github.io/cyclone_tutorial/installation.html)

Wanna learn Cyclone? just click [Start >](https://classicwuhao.github.io/cyclone_tutorial/chapter1/tutorial-basics.html)

For quick reference of Cyclone specification language, click [Here >](https://classicwuhao.github.io/cyclone_tutorial/expr/reference.html)

Watch out, Cyclone is on its way...