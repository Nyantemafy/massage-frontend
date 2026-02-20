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

// Custom resolver to redirect font requests to CDN
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect font requests to CDN
  if (moduleName && moduleName.includes('@expo/vector-icons') && moduleName.includes('.ttf')) {
    const fontName = moduleName.split('/').pop();
    return {
      filePath: `https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/${fontName}`,
      type: 'sourceFile',
    };
  }
  
  // Redirect calendar images to CDN
  if (moduleName && moduleName.includes('react-native-calendars') && moduleName.includes('.png')) {
    const imageName = moduleName.split('/').pop();
    return {
      filePath: `https://cdn.jsdelivr.net/npm/react-native-calendars@1.1305.0/src/calendar/img/${imageName}`,
      type: 'sourceFile',
    };
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
