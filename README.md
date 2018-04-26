Markdown info loader
==

**Beta. Use on your own risk!**

Develop a static blog? You can get all required information about markdown file (includes title, YAML metadata, author, editor and last update time) without loading whole markdown contents (or with it).

Output
--

Result of loader is object with advanced file information.

**`*`** *- optional property*.

- **`resource`** Information about target resource:
  - **`path`** Absolute path to file;
  - **`localPath`** Path relative to the project root;
  - **`hashName`** Unique hash number between 0 and 4294967295 (generated from *localPath*);
- **`meta`*** Document metadata:
  - **`heading`*** Document heading;
  - **`...`*** Front matter metadata (see [here](https://jekyllrb.com/docs/frontmatter/) and [here](https://www.npmjs.com/package/yaml-front-matter))
- **`git`*** Information about file git state:
  - **`commits`*** File commits info;
    - **`initial`*** Initial commit info;
    - **`last`*** Last commit info;
    - **`all`*** All commits info;
- **`module`*** File module;

For example:
```js
{
  resource: {
    path: '~/projects/library/src/items/hamlet.md',
    localPath: '/src/items/hamlet.md',
    hashName: 4294967295,
  },
  meta: {
    heading: 'Hamlet',
    author: 'William Shakespeare',
    year: '1600'
  },
  git: {
    commits: {
      initial: {
        an: 'admin',
        ae: 'admin@example.com'
        at: 1524365103,
      },
      last: {
        an: 'moderator',
        ae: 'moderator@example.com',
        at: 1524365204,
      },
    }
  },
  module: Function
}
```

Options
--

### `parse.heading` **(bool)**
_Default: `true`_

Parse markdown primary heading.

For example:
```md
Hamlet
--

To be or not to be
```

Will give:

```js
{
  meta: {
    heading: 'Hamlet'
  }
}
```

### `parse.frontMatter` **(bool)**
_Default: `true`_

Parses front matter data. Result will be assigned in to `meta` property.

For example:
```md
---
author: William Shakespeare
year: 1600
---
Hamlet
--

To be or not to be
```

Will give:

```js
{
  meta: {
    author: 'William Shakespeare',
    year: '1600',
  }
}
```

More ditails
[here](https://jekyllrb.com/docs/frontmatter/) and [here](https://www.npmjs.com/package/yaml-front-matter).

### `git` **(bool|object)**
_Default: `true`_

Use [git](https://git-scm.com/) CLI to collect advanced information about file, such as author name, email, and create date;

**Ensure that git is installed on machine on which your project builds and project root directory contains `.git` folder!**

By the defaults, you'll get information (author name, author email and date) about initial commit and last commit.

```js
{
  git: {
    commits: {
      initial: {
        at: "1522742493",
        ae: "ivani@example.com",
        an: "Ivan Ivanov"
      },
      last: {
        at: "1523235676",
        ae: "petrp@example.com",
        an: "Petr Petrov"
      }
    },
  }
  ...
}
```

But if you prefer to configure git collector in advanced mode, you should define `git` option as an object. That object may have next properties:

- **`placeholders`** (array) _Default: [`an`, `ae`, `at`]_ Array of placeholders, supported by `git log --pretty=format`;
- **`initial`** (bool) _Default: true_ Get properties of initial commit;
- **`last`** (bool) _Default: true_ Get properties of last commit;
- **`all`** (bool) _Default: false_ Get all commits (heavy);
- **`formatSep`** (string) Separator of placeholders (by default the separator is quite unique, but you can define your delimiter to avoid collisions)

Custom configuration will be deep mixed with the default configuration, thus shape like `{ all: false }` will be correct.

### `importSource` **(object)**

Use another loader to load source (will be placed into `source` property)

Thus you can at the same time load both file's metadata and its content.


```js
{
  test   : /\.md$/,
  exclude: /node_modules/,
  use    : {
    loader : `markdown-info-loader`,
    options: {
      git: {
        last: false,
      },
      importSource: [
        `raw-loader`,
      ],
    },
  },
}
```

```js
{
  heading: 'My article 1',
  commits: {
    initial: {
      at: "1522742493",
      ae: "ivani@example.com",
      an: "Ivan Ivanov"
    }
  },
  source: 'My article\n==Hello, world'
}
```

But this option is most convenient if you'd prefer to get file's metadata immediately, but show its content only at some special route. For this, you may use [bundle-loader](https://github.com/webpack-contrib/bundle-loader) as an advanced loader in the option `importSource`. And in this case, metadata will be used for creating lightweight list of available markdown files, at the same time the `source` can be loaded asynchronously.

```js
{
  test   : /\.md$/,
  exclude: /node_modules/,
  use    : {
    loader : `markdown-info-loader`,
    options: {
      importSource: [
        `bundle-loader`,
        `markdown-loader`,
      ],
    },
  },
}
```

```js
{
  heading: 'My article 1',
  source: function bundle
}
```

### `parse.commonmark` **(bool)**
_Default: true_

Enables remark-parse commonmark option (see [ditails](https://github.com/remarkjs/remark/tree/master/packages/remark-parse#optionscommonmark))

### `plugins` **(bool)**
_Default: undefined_

Array of functions, which will be called in loader context.

The plugin is a function, that is called in loader context and has parameters `info` (result object) and `ast` (parsed from markdown). The result of a plugin can be a javascript code, which will be added between import block and result block.


License
--

MIT

Author
--

Vladimir Kalmykov <vladimirmorulus@gmail.com>
