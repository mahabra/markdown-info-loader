Wiring plugins
==

The **markdown-info-loader** plugin is a function, that will be called in loader context at the last moment before loader finished job.

```
function (
  ast: object,
  info: object,
  source: string,
  output: array<string>,
) : string | nil
```

**Plugin parameters:**

**ast** Markdown AST, parsed by [remark-parse](https://github.com/remarkjs/remark/tree/master/packages/remark-parse).

**info** The resultative module (exactly what user will get from import). Contains all collected information. Your plugin may mutate it.

**source** Raw file source;

**output** An array of strings, that at the end will be concatenated into javascript code. Don't mutate it without a full understanding of the consequences.

## With plugin you can do:

### Inspect `ast`

You can walk AST and get any information from it.

For example, built-in parser of document heading is arranged like this:

```js
function getHeadingPlugin(ast, info) {
  var headingKey = ast.children && ast.children.findIndex(function (item) {
    return item.type === `heading` && item.depth === 1;
  });

  info.meta = info.meta || {};
  if (headingKey >= 0) {
    info.meta.heading = ast.children[headingKey].children[0]
      && ast.children[headingKey].children[0].value;
  } else {
    info.meta.heading = false;
  }
}
```

### Mutate `info`

Any collected by you information may be assigned to `info` object.

```js
function getNodesCountPlugin(ast, info) {
  // Total AST nodes
  info.totalNodesCount = ast.children.length;
}
```

And this data will be received by import.

### Add node.js code

You can return string with javascript code and it will be executed by node.js.

```js
function getPreviewPlugin(ast, info) {
  return `
let picture = null;
try {
picture = require('${this.context}/picture.jpg')
} catch (e) {
// do nothing
}

Object.assign(module.exports, { picture })
`;
}
```

As you see you can access `module.exports` to assign extra data. As well as you can use `require` and other joys of node.js to get the required information.

## Adding plugins

Add plugin(s) in loader options.

```js
{
  test   : /\.md$/,
  exclude: /node_modules/,
  use    : {
    loader : `markdown-info-loader`,
    options: {
      plugins: [

      ],
    },
  },
}
```
