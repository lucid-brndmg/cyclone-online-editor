---
title: "enum"
keywords: ["enum"]
id: "enum"
---

The enum keyword is used to declare an enum type variable.

##### Syntax

The syntax is as follows:

```cyclone
 enum {value1,value2,...valuen} var[=initializer];
```

The **var** here must be a legal variable name.

##### Scope

It is used in the variable declaration.

##### Semantics

Declare an enum type variable. An enum type variable must be equal to one of the pre-defined values. The pre-defined values are constant so it is recommended to use uppercase letters.

##### Examples

```cyclone
 //lights can only be: RED, AMBER or GREEN.
 enum {RED, AMBER, GREEN} lights;
```



```cyclone
 enum {ON, OFF} switch;
 normal state PowerOff{
        switch=#OFF;
}
```