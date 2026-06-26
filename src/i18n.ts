import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enUS from "./locales/en_US.json";
import zhCN from "./locales/zh_CN.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: {
      zh: ["zh_CN"],
      default: ["en_US"],
    },
    supportedLngs: ["en", "en_US", "zh", "zh_CN"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      lookupLocalStorage: "i18nextLng",
    },
    react: {
      useSuspense: false,
    },
    resources: {
      en_US: { translation: enUS },
      zh_CN: { translation: zhCN },
    },
  });

export default i18n;
