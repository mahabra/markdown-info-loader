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
var isObjectLike = require(`lodash.isobjectlike`);
var zipObject = require(`lodash.zipobject`);
var defaultsDeep = require(`lodash.defaultsdeep`);

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
/* Function saveParseInt(date) {
   var result = parseInt(date, 10);
   return Number.isNaN(result) ? 0 : result;
   } */

var DEFAULT_GIT_FORMAT_SEPARATOR = `-unrepraduciible-mil-GEV-3155-`;

/* Perry format to get author name, author email, and create date */
var DEFAULT_COMMIT_PROPERTIES = [`an`, `ae`, `at`];

var DEFAULT_FETCH_GIT_CONFIGURATION = {
  /* Array of placeholders, which should be parsed from git log */
  placeholders: DEFAULT_COMMIT_PROPERTIES,

  /* Get initial commit */
  initial: true,

  /* Get last commit */
  last: true,

  /* Get all commits */
  all: false,

  /* Seprator for pretty format */
  formatSep: DEFAULT_GIT_FORMAT_SEPARATOR
};

function getCommitOutputParser(placeholders, sep) {
  return function parseFormat(output) {
    const values = output.split(sep);
    return zipObject(placeholders, values);
  };
}

function addPercentSymbol(str) {
  return `%${str}`;
}

/* Converts array to pretty format query */
function buildPrettyFormat(placeholders, sep) {
  return placeholders.map(addPercentSymbol).join(sep);
}

function spawnGitLog(resourcePath, prettyFormat, middleOptions = []) {
  const options = [`log`]
    .concat(middleOptions)
    .concat([`--pretty=format:${prettyFormat}`, `--`, resourcePath]);
  const child = spawn.sync(`git`, options, {
    cwd: path.dirname(resourcePath)
  });

  return child.stdout.toString(`utf-8`);
}

module.exports = function loader(source) {
  this.cacheable && this.cacheable();
  var output = [];
  var meta = {};
  var userOptions = loaderUtils.getOptions(this);
  var options = Object.assign({
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
    const configuration = isObjectLike(options.git)
      ? defaultsDeep(options.git, DEFAULT_FETCH_GIT_CONFIGURATION)
      : DEFAULT_FETCH_GIT_CONFIGURATION;

    /* Fast configuration validate */
    const validStructure = isObjectLike(configuration) &&
      Array.isArray(configuration.placeholders);

    if (!validStructure) {
      throw new TypeError(`Invalid git configuration`);
    }

    const prettyFormat = buildPrettyFormat(
      configuration.placeholders,
      configuration.formatSep
    );

    const commits = {};

    if (configuration.all) {
      const rawOutput = spawnGitLog(
        this.resourcePath,
        prettyFormat
      );

      commits.all = rawOutput
        .split(`\n`)
        .map(getCommitOutputParser(
          configuration.placeholders,
          configuration.formatSep
        ));
    }

    if (configuration.initial) {
      const rawOutput = spawnGitLog(
        this.resourcePath,
        prettyFormat,
        [`--diff-filter=A`, `-n 1`]
      );

      commits.initial = getCommitOutputParser(
        configuration.placeholders,
        configuration.formatSep
      )(rawOutput);
    }

    if (configuration.last) {
      const rawOutput = spawnGitLog(
        this.resourcePath,
        prettyFormat,
        [`-n 1`]
      );

      commits.last = getCommitOutputParser(
        configuration.placeholders,
        configuration.formatSep
      )(rawOutput);
    }

    Object.assign(meta, {
      commits
    });
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