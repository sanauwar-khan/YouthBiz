export const THEME_STORAGE_KEY = "youthbiz-theme";

export function readStoredTheme(storage) {
  try {
    return storage?.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function toggleStoredTheme(root, getStorage) {
  const currentTheme = root.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  try {
    getStorage()?.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Keep the current-session switch working when browser storage is unavailable.
  }
  return nextTheme;
}
