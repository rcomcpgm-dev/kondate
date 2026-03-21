const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve zustand's CJS build (avoids import.meta in ESM)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
