"use strict";

/* eslint no-underscore-dangle: 0 */
var path = require(`path`);
var stringifyLoaders = require(`webpack-stringify-loaders`);
var spawn = require(`cross-spawn`);
var unified = require(`unified`);
var parse = require(`remark-parse`);
var yaml = require(`yaml-front-matter`);
var loaderUtils = require(`loader-utils`);
var queryString = require(`query-string`);
var omit = require(`lodash.omit`);

/* Supports only loaders with serializable options */
function querifyLoaders(loaders) {
  if (typeof loaders === `string`) {
    return loaders;
  } else if (typeof loaders === `object`) {
    if (loaders instanceof Array) {
      return loaders.map(querifyLoaders);
    }
    if (typeof loaders.options === `object`) {
      return Object.assign({}, loaders, {
        query: queryString.stringify(loaders.options)
      });
    }
  }
  return loaders;
}

/* Parse string for integer without isNaN result. Returns 0 on parse error */
function saveParseInt(date) {
  var result = parseInt(date, 10);
  return Number.isNaN(result) ? 0 : result;
}

/* Fetch git props*/

/* Perry format to get author name, author email, and create date */
var GIT_LOG_PRETTY_MASK = `%an:%ae:%at`;

/* Parse git commit log, which has created with format mask */
function parseGitMeta(meta) {
  var metaData = meta.split(`:`);

  if (metaData.length !== 3) {
    return {};
  }

  return {
    author: {
      name: metaData[0],
      email: metaData[1]
    },
    date: saveParseInt(metaData[2], 10) * 1000
  };
}

module.exports = function loader(source) {
  this.cacheable && this.cacheable();
  var output = [];
  var meta = {};
  var userOptions = loaderUtils.getOptions(this);
  var options = Object.assign({
    /* Use git CLI to collect advanced information about file, such as author
     * name, email, and create date.
     * */
    git: true,
    /* TODO: In future plans to make possible to specify what exactly information git take on */

    /* Walk ast to find file heading */
    heading: true,

    /* Enables options.commonmark (for remark-parse)
     * There is some ditails about this option:
     * - Empty lines to split blockquotes
     * - Parentheses (( and )) around for link and image titles
     * - Any escaped ASCII-punctuation character
     * - Closing parenthesis ()) as an ordered list marker
     * - URL definitions (and footnotes, when enabled) in blockquotes */
    commonmark: true,

    /* You can specify advanced loader for markdown file (it can  be simple
     * markdown-loader or bundle-loader, for example)
     *
     * Loaded file will be added to `source` property of result object.
     *
     * Use standard webpack `use` option structure to describe it, but keep
     * in the mind, that it supports only serializable options */
    importSource: false
  }, userOptions);

  /* Prepare markdown parser (powered by unified and remark-parse) */
  var parser = unified().use(parse, Object.assign({
    commonmark: options.commonmark
  }, options));

  /* Parse yaml */
  var obj = yaml.loadFront(source);

  /* Preserve pure content (without YAML text) */
  var pureContent = obj.__content;

  /* Exclude markdown content from result, because content is optional */
  Object.assign(meta, omit(obj, [`__content`]));

  /* Use git CLI to get file advanced info */
  if (options.git) {
    /* Initial commit allows us to get info file author */
    var result = spawn.sync(`git`, [`log`, `--diff-filter=A`, `-n 1`, `--pretty=format:${GIT_LOG_PRETTY_MASK}`, `--`, this.resourcePath], {
      cwd: path.dirname(this.resourcePath)
    });

    Object.assign(meta, parseGitMeta(result.stdout.toString(`utf-8`)));
  }

  /* Walk ast for heading */
  if (options.heading) {
    var ast = parser.parse(pureContent);

    var headingKey = ast.children && ast.children.findIndex(function (item) {
      return item.type === `heading` && item.depth === 1;
    });

    if (headingKey >= 0) {
      meta.heading = ast.children[headingKey].children[0] && ast.children[headingKey].children[0].value;
      ast.children.splice(headingKey, 1);
    } else {
      meta.heading = false;
    }
  }

  /* Import source */
  if (options.importSource) {
    /* Import source can be as a single loader, i.q. array of loaders.
     * withal loader can ba a string, ot an object */
    var inlineLoader = stringifyLoaders(querifyLoaders(options.importSource));
    output.push(`const source = require('!${inlineLoader}!${this.resourcePath}');`);
  } else {
    output.push(`const source = null;`);
  }

  output.push(`module.exports = Object.assign(
    ${JSON.stringify(meta)},
    {
      source: source,
    }
  )`);

  // Done
  return output.join(`\n`);
};