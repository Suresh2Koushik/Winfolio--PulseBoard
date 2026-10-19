import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "winfolio-theme";
const CHANGE_EVENT = "winfolio-theme-change";

// The public pages (landing, sign-in, legal) are designed around the light pastel brand; they stay light.
const LIGHT_ONLY_PATHS = ["/", "/auth", "/privacy", "/terms"];

export function getThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // Storage unavailable (private mode): fall through to the default.
  }
  return "light";
}

export function setThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Not persisted, but still applied for this visit.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: preference }));
}

const systemPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

/** Whether the app should currently render dark, for a given page. */
export function resolveDark(preference: ThemePreference, pathname: string) {
  if (LIGHT_ONLY_PATHS.includes(pathname)) return false;
  return preference === "dark" || (preference === "system" && systemPrefersDark());
}

export function applyTheme(pathname: string, preference = getThemePreference()) {
  const dark = resolveDark(preference, pathname);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  return dark;
}

/** The saved preference, kept in sync across components and tabs. */
export function useThemePreference() {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference);
  useEffect(() => {
    const sync = () => setPreference(getThemePreference());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [preference, setThemePreference] as const;
}

/** Applies the theme for the current page, following system changes when set to "system". */
export function useApplyTheme(pathname: string) {
  const [preference] = useThemePreference();
  const [dark, setDark] = useState(() => resolveDark(preference, pathname));
  useEffect(() => {
    setDark(applyTheme(pathname, preference));
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDark(applyTheme(pathname, preference));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [pathname, preference]);
  return dark;
}
