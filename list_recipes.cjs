const fs = require('fs');
const t = fs.readFileSync('src/data/recipes.js', 'utf8');

const crStart = t.indexOf('CREOLE_RECIPES');
const wrStart = t.indexOf('WORLD_RECIPES');
const allStart = t.indexOf('ALL_RECIPES');

const creolePart = t.substring(crStart, wrStart);
const worldPart = t.substring(wrStart, allStart);

const creoleIds = creolePart.match(/id:\s*"([^"]+)"/g) || [];
const worldIds = worldPart.match(/id:\s*"([^"]+)"/g) || [];

console.log('CREOLE_RECIPES (' + creoleIds.length + '):');
creoleIds.forEach(x => console.log('  ' + x));
console.log('\nWORLD_RECIPES (' + worldIds.length + '):');
worldIds.forEach(x => console.log('  ' + x));
console.log('\nTotal:', creoleIds.length + worldIds.length);

// Check for missing recipes compared to recipeImages.js
const img = fs.readFileSync('src/data/recipeImages.js', 'utf8');
const imgIds = (img.match(/"([^"]+)":\s*"https/g) || []).map(m => m.match(/"([^"]+)"/)[1]);
console.log('\nImage mappings:', imgIds.length);

// Recipes without dedicated images
const allRecipeIds = [...creoleIds, ...worldIds].map(x => x.match(/"([^"]+)"/)[1]);
const missing = allRecipeIds.filter(id => !imgIds.includes(id));
if (missing.length) {
  console.log('Recipes without image mapping:', missing);
}
