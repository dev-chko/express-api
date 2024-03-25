# set config for vscode debugging

```
"configurations": [
  {
    "type": "node",
    "request": "launch",
    "name": "nodemon",
    "runtimeExecutable": "${workspaceFolder}/node_modules/nodemon/bin/nodemon.js",
    "program": "${workspaceFolder}/server.js",
    "restart": true,
    "console": "integratedTerminal",
    "internalConsoleOptions": "neverOpen"
  }
]
```



## settings
ecosystemconfig.sample.js -> ecosystem.config.js