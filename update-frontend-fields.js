const fs = require('fs');
const path = require('path');

// Directories to search for files
const directoriesToSearch = [
  '/home/irfan/Documents/PROJELER/URTMtakip/frontend/src/pages',
  '/home/irfan/Documents/PROJELER/URTMtakip/frontend/src/components',
];

// File extensions to process
const fileExtensions = ['.js', '.jsx'];

// Words to replace
const replacements = [
  { from: 'musteri_adi', to: 'plan_liste_no' },
  { from: 'Müşteri:', to: 'Plan:' },
  { from: 'Müşteri :', to: 'Plan :' },
  { from: 'musteriAdi', to: 'planListeNo' }
];

// Function to process a file
function processFile(filePath) {
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply all replacements
    for (const replacement of replacements) {
      const regex = new RegExp(replacement.from, 'g');
      const newContent = content.replace(regex, replacement.to);
      
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    // If content was modified, write it back to the file
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
  }
}

// Function to search directories recursively
function searchDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stats = fs.statSync(fullPath);
    
    // If it's a directory, search it recursively
    if (stats.isDirectory()) {
      searchDirectory(fullPath);
    } 
    // If it's a file with one of the target extensions, process it
    else if (fileExtensions.includes(path.extname(fullPath))) {
      processFile(fullPath);
    }
  }
}

// Start processing directories
console.log('Starting frontend field update...');
console.log(`Searching in directories: ${directoriesToSearch.join(', ')}`);
for (const directory of directoriesToSearch) {
  console.log(`Searching directory: ${directory}`);
  try {
    searchDirectory(directory);
  } catch (error) {
    console.error(`Error searching directory ${directory}: ${error.message}`);
  }
}
console.log('Field update completed!');
