const STORAGE_KEY = "killagain-food:chat-history";
const MAX_ENTRIES = 50;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_ENTRIES)));
}

/** Save a question+response pair */
export function saveChatEntry(question, response) {
  const history = load();
  history.push({
    id: Date.now().toString(36),
    question,
    title: response?.title || "",
    answer: response?.answer || "",
    recipeCount: response?.recipes?.length || 0,
    timestamp: new Date().toISOString(),
  });
  save(history);
}

/** Get all history (newest last) */
export function getChatHistory() {
  return load();
}

/** Clear all history */
export function clearChatHistory() {
  save([]);
  return [];
}
