const { getDefaultConfig } = require('expo/metro-config');
const { withRorkMetro } = require('@rork-ai/toolkit-sdk/metro');

const config = getDefaultConfig(__dirname);

// Needed for some subpath/exports-based imports like "zod/v4"
config.resolver.unstable_enablePackageExports = true;

module.exports = withRorkMetro(config);

