---
title: "fresh" # title of the document
keywords: ["fresh"] # keywords of cyclone which user can trigger by hovering cursor on 
id: "fresh"
---

```cyclone
fresh(global_variable)
```

The fresh expression introduces a new copy of a graph/machine scope variable when a node/state is visited.

The fresh expression introduces a new copy of a graph-scope variable. The type and conditions specified with a where clause are retained. Expressions after the fresh expression that are referring to this new copy of graph-scope variable. This can ensure every time a node is visited a different value may be assigned to the fresh variable (depending on the conditions).

The fresh expression can appear anywhere inside a node/state section.

[documentation](https://classicwuhao.github.io/cyclone_tutorial/expr/fresh.html)