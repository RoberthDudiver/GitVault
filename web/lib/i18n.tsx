"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "es";

const translations = {
  en: {
    // Nav
    "nav.vaults": "Vaults",
    "nav.apps": "Apps",
    "nav.settings": "Settings",
    "nav.signOut": "Sign out",

    // Vault explorer
    "vault.explorer": "Vault Explorer",
    "vault.uploadAs": "Upload as:",
    "vault.public": "Public",
    "vault.private": "Private",
    "vault.publicDesc": "Direct public URL, no auth needed",
    "vault.privateDesc": "Accessible with credentials only",
    "vault.dropFiles": "Drop files here or",
    "vault.browse": "browse",
    "vault.fileLimits": "Images \u00b7 Documents \u00b7 Audio \u00b7 Video \u00b7 Any file up to 10 MB",
    "vault.uploading": "Uploading\u2026",
    "vault.uploadFailed": "Upload failed. Please try again.",
    "vault.noFiles": "No files yet. Upload your first one above.",
    "vault.loadFailed": "Failed to load files.",
    "vault.galleryView": "Gallery view",
    "vault.tableView": "Table view",

    // File actions
    "file.delete": "Delete",
    "file.deleteConfirm": "Delete this file?",
    "file.yesDelete": "Yes, delete",
    "file.deleting": "Deleting\u2026",
    "file.cancel": "Cancel",
    "file.copyUrl": "Copy URL",
    "file.copied": "Copied!",
    "file.preview": "Preview",
    "file.download": "Download",
    "file.downloadFile": "Download file",
    "file.makePrivate": "Make private",
    "file.makePublic": "Make public",
    "file.loading": "Loading\u2026",
    "file.noPreview": "Unable to load file preview",
    "file.failed": "Failed",

    // Table headers
    "table.name": "Name",
    "table.type": "Type",
    "table.size": "Size",
    "table.visibility": "Visibility",
    "table.deleteQ": "Delete?",
    "table.yes": "Yes",
    "table.no": "No",

    // Settings
    "settings.title": "Settings",
    "settings.github": "GitHub Connection",
    "settings.configured": "Configured",
    "settings.notConfigured": "Not configured",
  },
  es: {
    // Nav
    "nav.vaults": "Vaults",
    "nav.apps": "Apps",
    "nav.settings": "Ajustes",
    "nav.signOut": "Cerrar sesi\u00f3n",

    // Vault explorer
    "vault.explorer": "Explorador de Vault",
    "vault.uploadAs": "Subir como:",
    "vault.public": "P\u00fablico",
    "vault.private": "Privado",
    "vault.publicDesc": "URL p\u00fablica directa, sin autenticaci\u00f3n",
    "vault.privateDesc": "Accesible solo con credenciales",
    "vault.dropFiles": "Arrastra archivos aqu\u00ed o",
    "vault.browse": "selecciona",
    "vault.fileLimits": "Im\u00e1genes \u00b7 Documentos \u00b7 Audio \u00b7 Video \u00b7 Cualquier archivo hasta 10 MB",
    "vault.uploading": "Subiendo\u2026",
    "vault.uploadFailed": "Error al subir. Int\u00e9ntalo de nuevo.",
    "vault.noFiles": "A\u00fan no hay archivos. Sube el primero arriba.",
    "vault.loadFailed": "Error al cargar archivos.",
    "vault.galleryView": "Vista galer\u00eda",
    "vault.tableView": "Vista tabla",

    // File actions
    "file.delete": "Eliminar",
    "file.deleteConfirm": "\u00bfEliminar este archivo?",
    "file.yesDelete": "S\u00ed, eliminar",
    "file.deleting": "Eliminando\u2026",
    "file.cancel": "Cancelar",
    "file.copyUrl": "Copiar URL",
    "file.copied": "\u00a1Copiado!",
    "file.preview": "Vista previa",
    "file.download": "Descargar",
    "file.downloadFile": "Descargar archivo",
    "file.makePrivate": "Hacer privado",
    "file.makePublic": "Hacer p\u00fablico",
    "file.loading": "Cargando\u2026",
    "file.noPreview": "No se pudo cargar la vista previa",
    "file.failed": "Fall\u00f3",

    // Table headers
    "table.name": "Nombre",
    "table.type": "Tipo",
    "table.size": "Tama\u00f1o",
    "table.visibility": "Visibilidad",
    "table.deleteQ": "\u00bfEliminar?",
    "table.yes": "S\u00ed",
    "table.no": "No",

    // Settings
    "settings.title": "Ajustes",
    "settings.github": "Conexi\u00f3n de GitHub",
    "settings.configured": "Configurado",
    "settings.notConfigured": "No configurado",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("gitvault_locale") as Locale | null;
    if (saved === "en" || saved === "es") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("gitvault_locale", l);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key] ?? key,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
