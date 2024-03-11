---
title: "3.5 Checking Modes"
prev: "34-conditional-transitions"
order: 24
---

### 3.5 Checking Modes

In this section, we will look at different checking modes available in Cyclone.

Probably, you have already seen some checking modes in previous Sections. In the current version, Cyclone has a list of 5 different check modes.

#### 1. Standard

This is one of the most common check modes in Cyclone. It allows you check all paths that have exact length **k**. If a specification is satisfied, then a single solution is returned. For example, the following command checks all paths that have exact length of **5**.

```cyclone
check for 5 
```

#### 2. Combo

The Combo mode in Cyclone is a special checking mode, it allows users to specify a list of different path lengths and checks them. In particular, The Combo mode combines the list of path lengths and generates the conditions that can be checked by Cyclone only once. Thus, one checks users will know whether there exits a solution for a specification within the given list of path lengths. For example, the following command checks a list of path length 3,5,7,8,9,10.

```cyclone
 check for 3,5,7,8,9,10
```

Each path length is separated by a comma.

#### 3. Separation

The Separation mode in Cyclone checks a list of path lengths individually. This is different from the Combo mode. If the Separation mode is enabled, Cyclone will performs multiple checks. For example, the following command checks a list of path length 3,5,7,8,9,10 individually.

```cyclone
 check each 3,5,7,8,9,10
```

Cyclone performs 6 checks here for each path length. Thus, a user can immediately tell whether a particular path length has a solution or not.

#### 4. Range

The Range mode allows Cyclone to check all paths that have length from 1 upto **k**. Cyclone returns a single solution if a specification can be satisfied by at least one of the path lengths. For example, the following command checks all paths that have length from 1 to 10.

```cyclone
 check upto 10
```

The Range mode could be expensive, as users may set a very large path length. Thus, we recommend users should always keep this in mind that a significant large number may slow down the performance of Cyclone. Instead, a user may consider using the Separation mode to separate a range check to several each individual checks.

#### 5. Enumeration

As its name suggests, the Enumeration Mode allows Cyclone to discover all possible paths for a given path lengths. Each path returned is different from previous paths. Depends on the properties and the size of a model, we may never know how many solutions eventually return. Thus, users should be aware that this mode could be very expensive in terms of memory, CPU even for a small path length. For this reason, this mode can only allow users to specify an exact path length and no list of path lengths is allowed. For example the following command enumerates all possible path lengths that have length of 5.

```cyclone
 enumerate for 5
```