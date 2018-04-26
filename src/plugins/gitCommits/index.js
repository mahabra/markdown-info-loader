"use strict";

var path = require(`path`);
var spawn = require(`cross-spawn`);
var isObjectLike = require(`lodash.isobjectlike`);
var zipObject = require(`lodash.zipobject`);
var defaultsDeep = require(`lodash.defaultsdeep`);

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

module.exports = (config) => function getCommits(
  ast,
  info
) {
  const configuration = isObjectLike(config)
    ? defaultsDeep(config, DEFAULT_FETCH_GIT_CONFIGURATION)
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

  info.git = {
    commits
  };
};