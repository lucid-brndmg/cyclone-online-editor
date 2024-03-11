---
title: "3.2 Operators"
prev: "31-variable-types"
next: "33-assertion-and-invariant"
order: 21
---

### 3.2 Operators

Cyclone supports standard operators that are commonly adapted in programming languages domain. All operators supported are listed in the following sections.

#### Arithmetic Operators

The following operators can be applied to int and real types.

| **Name** | **Meaning**    | **Example** |
| -------- | -------------- | ----------- |
| +        | add            | a+b;        |
| -        | minus          | a-b;        |
| *        | multiplication | a*b;        |
| /        | division       | a/b;        |
| %        | remainder      | a%b;        |
| **       | power          | a**b;       |
| ++       | post-increment | a++;        |
| --       | post-decrement | a--;        |

Pre-increment and pre-decrement operators are not available in Cyclone. Hence, ++a/--a; is illegal in current version of Cyclone.

In any situation, you can add (minus/multiply/divide) an integer to a real and Cyclone will automatically treat the result as a real number. For example, Cyclone returns a type checking error for the following code:

```cyclone
int x=2;
real y=1.234;
int z=x+y;//illegal - type error
```

#### Boolean Operators

The following operators can be applied to bool types.

| **Name** | **Meaning**  | **Example** |
| -------- | ------------ | ----------- |
| &&       | and          | a && b;     |
| \|\|     | or           | a \|\| b;   |
| ^        | xor          | a ^ b;      |
| !        | not/negation | !a;         |
| =>       | implication  | a => b;     |

#### Relational Operators

The following operators can be applied to int and real types.

| **Name** | **Meaning**              | **Example** |
| -------- | ------------------------ | ----------- |
| >        | greater than             | a > b;      |
| ≥        | greater than or equal to | a >= b;     |
| <        | less than                | a < b;      |
| ≤        | less than or equal to    | a<=b;       |

#### Standard Operators

The following operators can be applied to int, real and bool types.

| **Name** | **Meaning**       | **Example** |
| -------- | ----------------- | ----------- |
| ==       | comparison        | a == b;     |
| !=       | not equal to      | a != b;     |
| +=       | plus equal to     | a+=b;       |
| -=       | minus equal to    | a-=b;       |
| *=       | multiply equal to | a*=b;       |
| /=       | divide equal to   | a/=b;       |
| =        | assignment        | a=b;        |

#### One Operator

Besides the operators mentioned above, Cyclone also provides a special operator called one operator. The one operator allows users to specify/express the meaning of exactly one of multiple conditions must be met. For example, the following code indicates that exactly one of the three conditions: a≥x,a≥y,a≥z must be met.

```cyclone
one(a>=x,a>=y,a>=z);
```

The type of each condition must be a boolean expression. The one operator can also be used in a nested way. For example,

```cyclone
one(a+b>t,t+a>s,one(a>=x,a>=y,a>=z));
```