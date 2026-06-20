const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch CSS để Metro recompile khi có class mới
config.watchFolders = [path.resolve(__dirname)];

// Path alias @/* → src/*
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});
