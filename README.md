Markdown info loader
==

**Beta. Use on your own risk**

Build a static blog? You can get all requred information about markdown file (includes author and last update time) with this loader.

Options
--

- `git` **(bool)** Use git CLI to collect advanced information about file, such as author name, email, and create date;
- `heading` **(bool)** Parse markdown content and get its heading;
- `commonmark` **(bool)** Enables remark-parse commonmark option (see [ditails](https://github.com/remarkjs/remark/tree/master/packages/remark-parse#optionscommonmark))
- `importSource` **(object)** Use another loader to load source (will be placed to `source` property)

Webpack configuration example:
--

```js
{
  test   : /\.md$/,
  exclude: /node_modules/,
  use    : {
    loader : `markdown-meta-loader`,
    options: {
      importSource: [
        `bundle-loader`,
        `markdown-loader`,
      ],
    },
  },
}
```

License
--

MIT

Author
--

Vladimir Kalmykov <vladimirmorulus@gmail.com>
