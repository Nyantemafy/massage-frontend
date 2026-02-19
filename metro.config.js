const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for vector icons and other assets
config.resolver.assetExts.push(
  // Fonts
  'ttf',
  'otf',
  'woff',
  'woff2',
  // Images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp'
);

// Configure source extensions
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Handle vector icons properly
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
