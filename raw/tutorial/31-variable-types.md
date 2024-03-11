---
title: "3.1 Variable Types"
prev: "28-exercises-2"
next: "32-operators"
order: 20
---

# Chapter 3: Understanding Cyclone

In this Chapter, we will explain some of the Cyclone language features in detail. This may help you to understand Cyclone better for building your models.

### 3.1 Variable Types

The value of a variable in Cyclone can be **changed** from state to state. In the current version of Cyclone, there are five types of variable a user can use.

- int
- real
- bool
- enum
- record

#### Integer

An integer type variable is declared using keyword int. The range of an integer is the same as the those integers in a general purpose programming language such as Java and C++. That is from -2147483648 to 2147483647. For example, the following piece of code creates an integer type variable called **x**, and this x is initialized with value of 0.

```cyclone
   int x=0;
```

#### Real

A real type variable is declared using keyword real. The range of a real number is from about 3.40282347x1038 to 1.40239846x10-45. For example, the following piece of code simply creates a real number of **x**,

```cyclone
   real x=-2.32;
```

When Cyclone produces a trace that has real numbers, by default two digits after a decimal point are preserved. However, one can set a different precision through an option. For example, the following option tells the compiler to preserve 4 digits (after a decimal point) during trace generation.

```cyclone
   option-precision=4;
```

Currently, Cyclone can preserve 1-6 digits after a decimal point for a real number.

#### Bool

A bool type variable is declared using keyword bool. Only boolean-typed values (**true** and **false**) can be assigned to a bool type variable. For example, the following initialization of a boolean variable is illegal.

```cyclone
   bool b=x+3; //illegal
```

#### Enum

An enum type variable is used for a set of predefined constants. This is done through using enum. An enum variable must be equal to one of the predefined constants. You can use a # to assign an enum variable to one of its predefined constants. For example, the following piece of code assigns a constant **ON** to the variable switch.

```cyclone
   enum {ON, OFF} switch=#ON;
```

#### Constant

A constant in Cyclone is very much the same as constants in other programming languages. That is once a constant is defined its value **cannot** be changed from state to state. To declare a constant data type, one can use the keyword constant. For example, the following code declares 3 different kinds of constants.

```cyclone
 const int A = 3;
 const real PI = 3.1415926;
 const bool B = true;
```

An enum type is a special constant. Thus, it cannot be declared using the keyword constant.

#### Record

A record type in Cyclone is a complex data type. It allows users to use a mix of different data field in a single data type. Currently, a user can declare the integer, real, bool and enum data fields within a record. For example, the following record creates a point that contains two integer fields:

```cyclone
 record point {
     int x;
     int y;
   };
```

We use a dot operator (.) to access its field just like other programming languages. Thus, the following code assigns a 0 to the field x in point.

```cyclone
 point.x = 0;
```

Each data field declared inside a record type can be associated with a where clause. A field is associated with a where clause is a conditional field (variable). See below.

#### Conditional Variables

In Cyclone, users can use a special type of variable called conditional variable to build their models. So what is a conditional variable ?

In short, a conditional variable is a variable that is attached to a boolean condition. During computation, a conditional variable must meet the attached condition. Conditional variables are quite useful for limiting the range of a variable. To create a conditional variable, users can create a normal variable first and then use a [where](https://classicwuhao.github.io/cyclone_tutorial/expr/where.html) clause to specify a condition. For example, the following piece of code creates a conditional variable **x**

```cyclone
 int x = 1 where x <= 0 && x >= 3;
```

This variable x is a conditional variable. It is initialized with a value of 1 and attached to a condition: it must stay between 0 and 3 during the computation.

There are some rules when creating a conditional variable:

- [where](https://classicwuhao.github.io/cyclone_tutorial/expr/where.html) clause can only specify a boolean condition.
- [where](https://classicwuhao.github.io/cyclone_tutorial/expr/where.html) clause cannot be used for a constant including enum data type.
- The condition described by the [where](https://classicwuhao.github.io/cyclone_tutorial/expr/where.html) clause cannot use other variables except for itself or a constant.

For example, the following conditional variables are illegal in Cyclone.

```cyclone
 int x where x = x+1; //not a boolean condition
 int y where y > x;//refer to another variable x
 const int z where z > 2;//z is a constant
```

Semantically speaking, the condition specified by a conditional variable must hold in any computation. This includes each computation in every node/state including initial node/state.

The following piece of code shows a valid conditional variable in use of computing an area of a circle.

```cyclone
 const real PI=3.14159;
 const int MAX=15;
 const int MIN=7;
 int r where r >= MIN && r <= MAX;
 real area = PI * r * r;
```

During any computation, the variable **r** must stay between 7 and 15.

#### 3.1.7 Fresh Variables

To keep the design of Cyclone simple, all variables declared in Cyclone are visible to every node/state. Thus, every node/state can use a variable for its own computation. However, sometime we would like to use a variable that does not depend on other states. In other words, this variable is state independent. A user can use fresh variables for state independent variables.

