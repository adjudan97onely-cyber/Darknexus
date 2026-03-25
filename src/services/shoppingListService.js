const STORAGE_KEY = "killagain-food:shopping-list";

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Add ingredients from a recipe to the shopping list */
export function addToShoppingList(recipeName, ingredientLines) {
  const list = load();
  const entry = {
    id: Date.now().toString(36),
    recipe: recipeName,
    items: ingredientLines.map((line) => ({ text: line, checked: false })),
    addedAt: new Date().toISOString(),
  };
  list.push(entry);
  save(list);
  return list;
}

/** Get the full shopping list */
export function getShoppingList() {
  return load();
}

/** Toggle checked state of one item */
export function toggleShoppingItem(entryId, itemIndex) {
  const list = load();
  const entry = list.find((e) => e.id === entryId);
  if (entry && entry.items[itemIndex]) {
    entry.items[itemIndex].checked = !entry.items[itemIndex].checked;
    save(list);
  }
  return load();
}

/** Remove a full recipe entry from the list */
export function removeShoppingEntry(entryId) {
  const list = load().filter((e) => e.id !== entryId);
  save(list);
  return list;
}

/** Clear all */
export function clearShoppingList() {
  save([]);
  return [];
}
