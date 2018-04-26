"use strict";

function alwaysTrue() {
  return true;
}

module.exports = function resolveUserPlugin(userPlugin) {
  let plugin = null;
  let pluginOptions = null;
  if (userPlugin && userPlugin instanceof Array) {
    plugin = userPlugin[0];
    pluginOptions = userPlugin[1] || null;
  } else if (typeof userPlugin === `object`) {
    plugin = userPlugin.use || null;
    pluginOptions = userPlugin.options || null;
  } else {
    plugin = userPlugin;
  }
  if (typeof plugin === `string`) {
    try {
      plugin = require(plugin);
    } catch (e) {
      throw new Error(`Plugin ${plugin} is not found`);
    }
  }

  if (typeof plugin !== `function`) {
    throw new TypeError(`Invalid plugin`);
  }

  pluginOptions = pluginOptions || plugin.defaultOptions || {};
  const condition = plugin.condition || alwaysTrue;

  return {
    use: (options) => {
      const pluginFn = plugin(options);

      if (typeof pluginFn !== `function`) {
        throw new Error(`Invalid plugin. Factory should return function`);
      }

      return pluginFn;
    },
    options: pluginOptions,
    condition
  };
};