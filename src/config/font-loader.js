// Font loader for web - loads fonts from CDN
export const loadFonts = () => {
  if (typeof window !== 'undefined') {
    const fonts = [
      {
        family: 'Ionicons',
        url: 'https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'
      },
      {
        family: 'MaterialCommunityIcons',
        url: 'https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'
      },
      {
        family: 'FontAwesome',
        url: 'https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'
      }
    ];

    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/ttf';
      link.crossOrigin = 'anonymous';
      link.href = font.url;
      document.head.appendChild(link);
    });
  }
};
