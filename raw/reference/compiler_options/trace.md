---
title: "option-trace"
keywords: ["trace"]
id: "trace"
---

```cyclone
bool option-trace;
```

If it is set to true (`option-trace=true;`), Cyclone will produce a trace file that contains concrete values of each variable in each state/node of the path discovered. If there is no model, no trace file will be generated. By default, this option is disabled (`false`). The trace of a specification file is stored in directory named trace that normally is under your current directory.