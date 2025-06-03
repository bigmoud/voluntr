const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = exclusionList([
  /node_modules\/ws\/.*/,
]);

config.resolver.extraNodeModules = {
  ws: require.resolve('./emptyShim.js'),
};

module.exports = config; 