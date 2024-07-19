---
title: "const"
keywords: ["const"]
id: "const"
---

The const modifier is used to create a constant.

##### Syntax

The syntax of const modifier is as follows:

```cyclone
const <type> name = <initializer>
```

The **<type>** here must be predefined type in Cyclone, and the **<initializer>** could be a value or an expression that evaluates to a value.

##### Scope

The const modifier must appear in front of a type declaration.

##### Semantics

A constant is always compiled into a pre-defined value and cannot be re-assigned (changed). A constant cannot be used with [fresh](https://classicwuhao.github.io/cyclone_tutorial/expr/fresh.html) or [initial](https://classicwuhao.github.io/cyclone_tutorial/expr/initial.html) expressions.

##### An Example

```cyclone
const real PI=3.14;
```