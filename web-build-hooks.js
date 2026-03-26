const fs = require('fs');
const path = require('path');

module.exports = {
  // This hook runs after the Metro build is complete
  postExport: async (args) => {
    const { projectRoot, exportPath } = args;
    
    // Create the exact directory structure that the app expects
    const fontsDir = path.join(exportPath, 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
    const calendarDir = path.join(exportPath, 'assets', 'node_modules', 'react-native-calendars', 'src', 'calendar', 'img');
    
    if (!fs.existsSync(fontsDir)) {
      fs.mkdirSync(fontsDir, { recursive: true });
    }
    
    if (!fs.existsSync(calendarDir)) {
      fs.mkdirSync(calendarDir, { recursive: true });
    }
    
    // Copy ALL vector icon fonts to the exact path expected by the app
    const sourceFontsDir = path.join(projectRoot, 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
    
    if (fs.existsSync(sourceFontsDir)) {
      const fonts = fs.readdirSync(sourceFontsDir);
      fonts.forEach(font => {
        const fontSource = path.join(sourceFontsDir, font);
        const fontDest = path.join(fontsDir, font);
        if (fs.existsSync(fontSource)) {
          fs.copyFileSync(fontSource, fontDest);
        }
      });
    }
    
    // Copy calendar images to the exact path expected
    const calendarSource = path.join(projectRoot, 'node_modules', 'react-native-calendars', 'src', 'calendar', 'img');
    
    const images = ['previous.png', 'next.png'];
    images.forEach(img => {
      const imgSource = path.join(calendarSource, img);
      const imgDest = path.join(calendarDir, img);
      if (fs.existsSync(imgSource)) {
        fs.copyFileSync(imgSource, imgDest);
      }
    });
  }
};
