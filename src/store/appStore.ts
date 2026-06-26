import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createConversionClient } from "../conversion/client";
import type { SerializedError } from "../conversion/types";

type ThemeMode = "light" | "dark";

interface AppStore {
  actualTheme: ThemeMode;
  appVersion: string;
  initialized: boolean;
  initializing: boolean;
  initError: SerializedError | null;
  language: string;
  setActualTheme: (theme: ThemeMode) => void;
  setLanguage: (language: string) => void;
  initializeRuntime: (force?: boolean) => Promise<void>;
}

export const conversionClient = createConversionClient();

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getPreferredLanguage(): string {
  if (typeof navigator === "undefined") {
    return "en_US";
  }
  return navigator.language === "zh-CN" ? "zh_CN" : "en_US";
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      actualTheme: getPreferredTheme(),
      appVersion: "",
      initialized: false,
      initializing: false,
      initError: null,
      language: getPreferredLanguage(),
      setActualTheme: (actualTheme) => set({ actualTheme }),
      setLanguage: (language) => set({ language }),
      initializeRuntime: async (force = false) => {
        const state = get();
        if (!force && (state.initialized || state.initializing)) {
          return;
        }
        set({ initializing: true, initError: null });
        try {
          await conversionClient.init({ force });
          const version = await conversionClient.version();
          set({
            appVersion: version,
            initialized: true,
            initializing: false,
            initError: null,
          });
        } catch (error) {
          const initError =
            error && typeof error === "object" && "message" in error
              ? (error as SerializedError)
              : { name: "Error", message: String(error) };
          set({
            initialized: false,
            initializing: false,
            initError,
          });
        }
      },
    }),
    {
      name: "libresvip-pwa-app",
      partialize: (state) => ({
        actualTheme: state.actualTheme,
        language: state.language,
      }),
    },
  ),
);
