const fs = require('fs');
const path = require('path');

module.exports = {
  // This hook runs after the Metro build is complete
  postExport: async (args) => {
    const { projectRoot, exportPath } = args;
    
    // Copy vector icons fonts to the correct location
    const fontsSource = path.join(projectRoot, 'node_modules', '@expo', 'vector-icons');
    const fontsDest = path.join(exportPath, 'assets', 'fonts');
    
    if (!fs.existsSync(fontsDest)) {
      fs.mkdirSync(fontsDest, { recursive: true });
    }
    
    // Copy Ionicons font
    const ioniconsSource = path.join(fontsSource, 'Ionicons.ttf');
    const ioniconsDest = path.join(fontsDest, 'Ionicons.ttf');
    
    if (fs.existsSync(ioniconsSource)) {
      fs.copyFileSync(ioniconsSource, ioniconsDest);
      console.log('Copied Ionicons font to web build');
    }
    
    // Copy calendar images
    const calendarSource = path.join(projectRoot, 'node_modules', 'react-native-calendars', 'src', 'calendar', 'img');
    const calendarDest = path.join(exportPath, 'assets', 'calendar');
    
    if (fs.existsSync(calendarSource)) {
      if (!fs.existsSync(calendarDest)) {
        fs.mkdirSync(calendarDest, { recursive: true });
      }
      
      const images = ['previous.png', 'next.png'];
      images.forEach(img => {
        const imgSource = path.join(calendarSource, img);
        const imgDest = path.join(calendarDest, img);
        if (fs.existsSync(imgSource)) {
          fs.copyFileSync(imgSource, imgDest);
          console.log(`Copied ${img} to web build`);
        }
      });
    }
  }
};
