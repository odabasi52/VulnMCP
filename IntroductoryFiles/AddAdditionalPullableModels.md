## Ollama Models
Pullable models are located at App.jsx:
```js
const ALL_PULL_MODELS = [
  'llama3:latest',
  'mistral:latest',
  'qwen2.5:latest',
  'deepseek-r1:1.5b'
];
```

You can add additional models that can be chosen from https://ollama.com/library. And simply add it for example:
```js
const ALL_PULL_MODELS = [
  'llama3:latest',
  'mistral:latest',
  'qwen2.5:latest',
  'deepseek-r1:1.5b'
  'gemma3:latest' /*Added this*/
];
```

