"use strict";

module.exports = {
  /* Get resource information */
  resource: true,

  /* Use git CLI to collect advanced information about file, such as author
   * name, email, and create date.
   *
   * @value (bool|object)
   *
   * Can be a bool, or a object.
   *
   * If object, it may have options:
   * - `placeholders` (array) Array of placeholders, supported by `git log --pretty=format`
   * - `initial` (bool) Get properties of initial commit
   * - `last` (bool) Get properties of last commit
   * - `all` (bool) Get all commits properties (heavy)
   * - `formatSep` (string) Separator of placeholders
   *
   * Custom configuration will be deep mixed with default configuration, thus shape like { all: false } will be correct.
   *
   * But in most cases you'd like to change only `placeholders` option
  */
  git: true,

  parse: {
    /* Get file front matter */
    frontMatter: true,

    /* Walk ast to find file heading */
    heading: true,

    /* Enables options.commonmark (for remark-parse)
     * There is some ditails about this option:
     * - Empty lines to split blockquotes
     * - Parentheses (( and )) around for link and image titles
     * - Any escaped ASCII-punctuation character
     * - Closing parenthesis ()) as an ordered list marker
     * - URL definitions (and footnotes, when enabled) in blockquotes */
    commonmark: true
  },

  /* You can specify advanced loader for markdown file (it can  be simple
   * markdown-loader or bundle-loader, for example)
   *
   * Loaded file will be added to `source` property of result object.
   *
   * Use standard webpack `use` option structure to describe it, but keep
   * in the mind, that it supports only serializable options */
  importSource: false
};