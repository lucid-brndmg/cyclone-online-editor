---
title: "option-timeout"
keywords: ["timeout"]
id: "timeout"
---

```cyclone
int option-timeout;
```

This allows users to set a soft timeout for the solver that Cyclone uses. The unit here is second. For example, `option-timeout=10;` will set a 10-second timeout. By default, no timeout is set.