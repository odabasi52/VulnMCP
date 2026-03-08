## HealhCheckBot
It executes below command:
```bash
ping -c 1 {HOST}
```

You can inject additional commands to host values such as;
```bash
ping -c 1 127.0.0.1;ls
```

This will result in below tool selection:
```
needs_tool_use: true
host: 127.0.0.1;ls
```
