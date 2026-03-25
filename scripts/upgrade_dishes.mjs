/**
 * Script pour ajouter les champs premium à tous les plats.
 * Approche: regex replace sur chaque bloc `id: "xxx"` -> insère les 3 champs
 * Exécuter: node scripts/upgrade_dishes.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const filePath = resolve("src/core/dishKnowledge.ts");
let content = readFileSync(filePath, "utf-8");

const UPGRADES = {
  "bokit-classique": { desireName: "Bokit doré croustillant, garni poulet épicé", premiumTier: "classique", plaisir: { gourmandise: 4, texture: 5, visuel: 3, arome: 4 } },
  "colombo-poulet": { desireName: "Colombo de poulet fondant aux épices créoles", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 4, visuel: 4, arome: 5 } },
  "blaff-poisson": { desireName: "Blaff de poisson frais, bouillon citronné parfumé", premiumTier: "signature", plaisir: { gourmandise: 4, texture: 3, visuel: 4, arome: 5 } },
  "accras-morue": { desireName: "Accras dorés croustillants, cœur moelleux à la morue", premiumTier: "classique", plaisir: { gourmandise: 5, texture: 5, visuel: 4, arome: 4 } },
  "dombre-crevettes": { desireName: "Dombré fondants aux crevettes, sauce tomate épicée", premiumTier: "signature", plaisir: { gourmandise: 4, texture: 4, visuel: 4, arome: 5 } },
  "court-bouillon": { desireName: "Court-bouillon de poisson à la créole, sauce relevée", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 3, visuel: 5, arome: 5 } },
  "matoutou-crabes": { desireName: "Matoutou de crabe royal, riz parfumé aux épices", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 4, visuel: 5, arome: 5 } },
  "quiche-lorraine": { desireName: "Quiche lorraine crémeuse, lardons fumés dorés", premiumTier: "classique", plaisir: { gourmandise: 4, texture: 4, visuel: 3, arome: 4 } },
  "gratin-dauphinois": { desireName: "Gratin dauphinois crémeux, croûte gratinée dorée", premiumTier: "classique", plaisir: { gourmandise: 5, texture: 4, visuel: 4, arome: 3 } },
  "coq-au-vin": { desireName: "Coq au vin mijoté, sauce onctueuse au vin rouge", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 4, visuel: 5, arome: 5 } },
  "beef-bourguignon": { desireName: "Bœuf bourguignon fondant, sauce au vin profonde", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 5, visuel: 5, arome: 5 } },
  "sole-meuniere": { desireName: "Sole meunière au beurre noisette, citron frais", premiumTier: "signature", plaisir: { gourmandise: 4, texture: 4, visuel: 5, arome: 4 } },
  "sauce-creme-classique": { desireName: "Sauce crème onctueuse aux herbes", premiumTier: "essentiel", plaisir: { gourmandise: 3, texture: 3, visuel: 2, arome: 3 } },
  "tarte-salee": { desireName: "Tarte salée rustique aux légumes de saison", premiumTier: "classique", plaisir: { gourmandise: 3, texture: 4, visuel: 3, arome: 3 } },
  "pain-au-beurre": { desireName: "Pain brioché au beurre doré, mie fondante", premiumTier: "classique", plaisir: { gourmandise: 4, texture: 5, visuel: 3, arome: 4 } },
  "omelette-persil": { desireName: "Omelette baveuse au persil frais, beurre mousseux", premiumTier: "essentiel", plaisir: { gourmandise: 3, texture: 4, visuel: 2, arome: 3 } },
  "pizza-margherita": { desireName: "Pizza margherita croustillante, mozzarella filante", premiumTier: "classique", plaisir: { gourmandise: 5, texture: 5, visuel: 4, arome: 4 } },
  "burger-classique": { desireName: "Burger smashé juteux, fromage fondant, bun toasté", premiumTier: "classique", plaisir: { gourmandise: 5, texture: 5, visuel: 4, arome: 4 } },
  "curry-poulet": { desireName: "Curry de poulet onctueux au lait de coco & épices", premiumTier: "classique", plaisir: { gourmandise: 5, texture: 4, visuel: 4, arome: 5 } },
  "pad-thai": { desireName: "Pad thaï aux crevettes, cacahuètes & citron vert", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 4, visuel: 5, arome: 5 } },
  "bouillabaisse": { desireName: "Bouillabaisse marseillaise, rouille safranée & croûtons", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 4, visuel: 5, arome: 5 } },
  "poulet-grille": { desireName: "Poulet grillé croustillant aux épices, jus doré", premiumTier: "classique", plaisir: { gourmandise: 4, texture: 5, visuel: 4, arome: 4 } },
  "steak-minute": { desireName: "Steak saisi à la perfection, beurre d\\u0027herbes fondant", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 5, visuel: 4, arome: 4 } },
  "saumon-poele": { desireName: "Pavé de saumon peau croustillante, beurre citronné", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 5, visuel: 5, arome: 4 } },
  "oeufs-brouilles-proteines": { desireName: "Œufs brouillés crémeux, ciboulette fraîche", premiumTier: "essentiel", plaisir: { gourmandise: 3, texture: 4, visuel: 2, arome: 3 } },
  "bowl-quinoa-poulet": { desireName: "Bowl protéiné quinoa, poulet grillé & avocat", premiumTier: "classique", plaisir: { gourmandise: 4, texture: 3, visuel: 5, arome: 3 } },
  "pates-aglio-olio": { desireName: "Spaghetti à l\\u0027ail doré, huile d\\u0027olive & piment", premiumTier: "essentiel", plaisir: { gourmandise: 4, texture: 3, visuel: 3, arome: 5 } },
  "riz-saute-legumes": { desireName: "Riz sauté au wok, légumes croquants & sauce soja", premiumTier: "essentiel", plaisir: { gourmandise: 3, texture: 4, visuel: 3, arome: 3 } },
  "soupe-legumes": { desireName: "Velouté de légumes de saison, touche de crème", premiumTier: "essentiel", plaisir: { gourmandise: 3, texture: 3, visuel: 2, arome: 3 } },
  "crepes-garnies": { desireName: "Crêpes fines & moelleuses, garniture gourmande", premiumTier: "classique", plaisir: { gourmandise: 4, texture: 4, visuel: 3, arome: 3 } },
  "lentilles-curry": { desireName: "Dhal onctueux au curcuma doré, naan chaud", premiumTier: "classique", plaisir: { gourmandise: 4, texture: 4, visuel: 4, arome: 5 } },
  "filet-mignon-sauce": { desireName: "Filet mignon en croûte dorée, duxelles de champignons", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 5, visuel: 5, arome: 5 } },
  "risotto-champignons": { desireName: "Risotto crémeux aux champignons, copeaux de parmesan", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 5, visuel: 5, arome: 5 } },
  "tartare-boeuf": { desireName: "Tartare de bœuf au couteau, jaune d\\u0027œuf coulant", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 4, visuel: 5, arome: 4 } },
  "tatin-tarte": { desireName: "Tarte tatin caramélisée, pommes fondantes dorées", premiumTier: "signature", plaisir: { gourmandise: 5, texture: 5, visuel: 5, arome: 5 } },
  "tartine-avocat": { desireName: "Tartine croquante avocat crémeux & œuf coulant", premiumTier: "essentiel", plaisir: { gourmandise: 4, texture: 4, visuel: 5, arome: 3 } },
  "wrap-poulet": { desireName: "Wrap croustillant poulet grillé & crudités fraîches", premiumTier: "essentiel", plaisir: { gourmandise: 3, texture: 4, visuel: 3, arome: 3 } },
  "salade-composee": { desireName: "Salade fraîche poulet grillé, vinaigrette citron maison", premiumTier: "essentiel", plaisir: { gourmandise: 3, texture: 3, visuel: 4, arome: 3 } },
};

// Stratégie: pour chaque id, trouver le block complet entre `{` et `},` 
// et remplacer par le même block + les 3 champs insérés
let modified = 0;
for (const [id, upgrade] of Object.entries(UPGRADES)) {
  // Pattern: find `name: "...",` line AFTER `id: "xxx",`
  const idLiteral = `id: "${id}",`;
  const idIdx = content.indexOf(idLiteral);
  if (idIdx === -1) {
    console.error(`❌ "${id}" non trouvé`);
    continue;
  }

  // Check already done
  const endBlock = content.indexOf("\n  },", idIdx);
  const block = content.substring(idIdx, endBlock);
  if (block.includes("desireName")) {
    console.log(`⏭️  "${id}" déjà fait`);
    continue;
  }

  // Find the name: line after this id
  const nameMatch = content.substring(idIdx).match(/name: "[^"]*",/);
  if (!nameMatch) {
    console.error(`❌ "${id}" pas de name: trouvé`);
    continue;
  }
  const oldNameLine = nameMatch[0];
  const desireNameLine = `${oldNameLine}\n    desireName: "${upgrade.desireName}",`;
  
  // Replace ONLY this occurrence (first after idIdx)
  const namePos = content.indexOf(oldNameLine, idIdx);
  content = content.substring(0, namePos) + desireNameLine + content.substring(namePos + oldNameLine.length);

  // Now find the closing `  },` for this dish and add premiumTier + plaisir before it
  const newIdIdx = content.indexOf(idLiteral);
  const newEndBlock = content.indexOf("\n  },", newIdIdx);
  const p = upgrade.plaisir;
  const extraFields = `\n    premiumTier: "${upgrade.premiumTier}",\n    plaisir: { gourmandise: ${p.gourmandise}, texture: ${p.texture}, visuel: ${p.visuel}, arome: ${p.arome} },`;
  content = content.substring(0, newEndBlock) + extraFields + content.substring(newEndBlock);
  
  modified++;
  console.log(`✅ "${id}" → ${upgrade.premiumTier}`);
}

writeFileSync(filePath, content, "utf-8");
console.log(`\n🎯 ${modified}/${Object.keys(UPGRADES).length} plats upgradés`);
