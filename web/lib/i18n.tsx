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

    // Landing / Hero
    "hero.title": "Store and serve files with Git as your backend",
    "hero.subtitle": "Upload images and files to GitHub repositories and serve them through a fast API. No extra storage costs — use what you already have.",
    "hero.getStarted": "Get started free",
    "hero.signIn": "Sign in",

    // Landing / Features
    "feature1.title": "GitHub-backed storage",
    "feature1.desc": "Every file you upload is committed directly to a GitHub repository you control. Reliable, versioned, and always under your ownership.",
    "feature2.title": "Fast CDN-like serving",
    "feature2.desc": "Serve any stored file through a clean API endpoint with response caching. Share public links or protect them with API keys.",
    "feature3.title": "Secure access",
    "feature3.desc": "Sign in with Firebase Auth — email, Google, or GitHub. Generate scoped API keys to control exactly who can read or write your files.",

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
    "file.confirm": "Confirm",
    "file.copy": "Copy",

    // Table headers
    "table.name": "Name",
    "table.type": "Type",
    "table.size": "Size",
    "table.visibility": "Visibility",
    "table.deleteQ": "Delete?",
    "table.yes": "Yes",
    "table.no": "No",

    // Vaults list page
    "vaults.title": "Vaults",
    "vaults.add": "+ Add vault",
    "vaults.empty": "You don't have vaults yet",
    "vaults.emptyDesc": "Connect an existing GitHub repo or create a new one to get started.",
    "vaults.addFirst": "Add first vault",
    "vaults.private": "Private",
    "vaults.public": "Public",
    "vaults.initializing": "initializing\u2026",
    "vaults.addVault": "Add vault",
    "vaults.useExisting": "Use existing repo",
    "vaults.createNew": "Create new repo",
    "vaults.ghNotConnected": "GitHub is not connected",
    "vaults.ghInstallApp": "Install the GitHub App to see your repositories.",
    "vaults.redirecting": "Redirecting to GitHub\u2026",
    "vaults.connectGH": "Connect GitHub",
    "vaults.alreadyInstalled": "Already installed? Refresh",
    "vaults.loadFailed": "Could not load repositories.",
    "vaults.retry": "Retry",
    "vaults.noRepos": "No repositories available.",
    "vaults.noReposDesc": "Make sure the GitHub App has access to your repos.",
    "vaults.searchRepo": "Search repository\u2026",
    "vaults.noResults": "No results for",
    "vaults.alreadyConnected": "already connected",
    "vaults.ghNoCreatePerm": "The GitHub App doesn't have permission to create repositories",
    "vaults.patPrompt": "Enter a Personal Access Token with repo scope to create repos on your behalf.",
    "vaults.pat": "Personal Access Token",
    "vaults.patPlaceholder": "ghp_xxxxxxxxxxxxxxxxxxxx",
    "vaults.createTokenGH": "Create token on GitHub \u2197",
    "vaults.savingAndCreating": "Saving and creating\u2026",
    "vaults.saveAndCreate": "Save token and create repo",
    "vaults.cancel": "Cancel",
    "vaults.willCreate": "A new repository will be created in your GitHub account and initialized as a GitVault vault.",
    "vaults.repoName": "Repository name",
    "vaults.repoPlaceholder": "my-images",
    "vaults.repoNameHint": "Only letters, numbers, hyphens and dots. No spaces.",
    "vaults.visibility": "Visibility",
    "vaults.privateDesc": "Only you and your apps",
    "vaults.publicCDN": "Direct CDN, faster",
    "vaults.creating": "Creating\u2026",
    "vaults.createRepoVault": "Create repo and vault",
    "vaults.invalidName": "Invalid name. Use letters, numbers, hyphens or dots.",
    "vaults.createError": "Error creating repository.",
    "vaults.createTokenError": "Error creating repository with token.",

    // Apps page
    "apps.title": "Apps",
    "apps.new": "New app",
    "apps.empty": "No apps yet.",
    "apps.emptyDesc": "Create an app to get API credentials for programmatic access.",
    "apps.active": "active",
    "apps.inactive": "inactive",
    "apps.newApp": "New app",
    "apps.appName": "App name",
    "apps.appNamePlaceholder": "My Integration",
    "apps.scopes": "Scopes",
    "apps.vaultAccess": "Vault access",
    "apps.vaultAccessHint": "Leave all unchecked to grant access to all vaults.",
    "apps.createFailed": "Failed to create app. Please try again.",
    "apps.creating": "Creating\u2026",
    "apps.createApp": "Create app",

    // App detail page
    "app.notFound": "App not found.",
    "app.deleteTitle": "Delete \"{name}\"?",
    "app.deleteWarning": "All credentials will be revoked immediately. This cannot be undone.",
    "app.deleting": "Deleting\u2026",
    "app.yesDelete": "Yes, delete app",
    "app.cancel": "Cancel",
    "app.deleteApp": "Delete app",
    "app.scopes": "Scopes",
    "app.credentials": "API Credentials",
    "app.generating": "Generating\u2026",
    "app.generateCred": "Generate credential",
    "app.generateFailed": "Failed to generate credential. Please try again.",
    "app.saveSecret": "Save your secret now \u2014 it won't be shown again.",
    "app.apiKey": "API Key",
    "app.apiSecret": "API Secret",
    "app.useAs": "Use as",
    "app.savedDismiss": "I've saved it, dismiss",
    "app.noCreds": "No credentials yet.",
    "app.created": "Created",
    "app.revokeConfirm": "Revoke this key?",
    "app.revoking": "Revoking\u2026",
    "app.yesRevoke": "Yes, revoke",
    "app.revoke": "Revoke",
    "app.failed": "Failed",

    // Settings page
    "settings.title": "Settings",
    "settings.ghConnection": "GitHub Connection",
    "settings.ghConnectionDesc": "GitHub App installed on your account to manage repositories.",
    "settings.connected": "Connected",
    "settings.notConnected": "Not connected",
    "settings.manageGH": "Manage GitHub connection",
    "settings.redirecting": "Redirecting\u2026",
    "settings.connectGHApp": "Connect GitHub App",
    "settings.refreshing": "Refreshing\u2026",
    "settings.refreshStatus": "Refresh status",
    "settings.pat": "Personal Access Token",
    "settings.patDesc": "Alternative when the GitHub App cannot create repositories. Provide a PAT with repo scope.",
    "settings.configured": "Configured",
    "settings.notConfigured": "Not configured",
    "settings.howToCreate": "How to create the token:",
    "settings.step1": "Go to github.com \u2192 Settings \u2192 Developer settings \u2192 Personal access tokens",
    "settings.step2": "Click Generate new token (classic)",
    "settings.step3": "Select the repo scope",
    "settings.step4": "Copy the token and paste it here",
    "settings.createTokenGH": "Create token on GitHub \u2197",
    "settings.replaceToken": "Replace current token\u2026",
    "settings.saving": "Saving\u2026",
    "settings.save": "Save",
    "settings.remove": "Remove",
    "settings.tokenSaved": "Token saved successfully.",
    "settings.tokenSaveFailed": "Could not save the token.",
    "settings.tokenRemoved": "Token removed.",
    "settings.tokenRemoveFailed": "Could not remove the token.",

    // Onboarding
    "onboarding.error": "Could not start GitHub connection. Please try again.",
    "onboarding.title": "Connect GitHub",
    "onboarding.desc": "GitVault needs access to your GitHub repositories to use them as file storage backends. Install the GitHub App to get started.",
    "onboarding.redirecting": "Redirecting to GitHub\u2026",
    "onboarding.installApp": "Install GitHub App",
    "onboarding.checking": "Checking\u2026",
    "onboarding.alreadyInstalled": "Already installed? Refresh",

    // Onboarding select-repo
    "onboarding.connected": "GitHub Connected!",
    "onboarding.redirectingVaults": "Redirecting to your vaults\u2026",

    // Footer
    "footer.builtBy": "Built by",
    "footer.openSource": "Open source on",
    "footer.terms": "Terms",
    "footer.privacy": "Privacy",

    // Help
    "help.title": "Help",
    "help.whatIs": "What is GitVault?",
    "help.whatIsDesc": "GitVault is a file storage platform that uses your own GitHub repositories as the storage backend. Upload files, and they get committed to a repo you control.",
    "help.howWorks": "How does it work?",
    "help.step1": "Connect a GitHub repository (new or existing)",
    "help.step2": "Upload files via the dashboard or API",
    "help.step3": "Each file is committed to your repo with SHA-256 deduplication",
    "help.step4": "Get a public URL to share or protect with API keys",
    "help.vaults": "Vaults",
    "help.vaultsDesc": "A vault is a GitHub repository connected to GitVault. You can connect existing repos or create new ones. Each vault stores files independently.",
    "help.apps": "Apps & API Keys",
    "help.appsDesc": "Create apps to get API credentials for programmatic access. Each app can have scoped permissions (read, write, delete) and can be restricted to specific vaults.",
    "help.publicPrivate": "Public vs Private files",
    "help.publicDesc": "Public files are served directly from GitHub's CDN \u2014 fast and free. Anyone with the URL can access them.",
    "help.privateDesc": "Private files require authentication (Bearer token or API key) to access. They are streamed through the GitVault API.",
    "help.api": "API Usage",
    "help.apiDesc": "Use HTTP Basic auth with your API key and secret. Example:",
    "help.limits": "Limits",
    "help.limitsDesc": "Max file size: 10 MB per file. Max batch: 20 files. GitHub API rate limits apply. Best for images, documents, and small-to-medium files.",
    "help.close": "Close",
  },
  es: {
    // Nav
    "nav.vaults": "Vaults",
    "nav.apps": "Apps",
    "nav.settings": "Ajustes",
    "nav.signOut": "Cerrar sesi\u00f3n",

    // Landing / Hero
    "hero.title": "Almacena y sirve archivos con Git como backend",
    "hero.subtitle": "Sube im\u00e1genes y archivos a repositorios de GitHub y s\u00edrvelos a trav\u00e9s de una API r\u00e1pida. Sin costos extra de almacenamiento \u2014 usa lo que ya tienes.",
    "hero.getStarted": "Comenzar gratis",
    "hero.signIn": "Iniciar sesi\u00f3n",

    // Landing / Features
    "feature1.title": "Almacenamiento en GitHub",
    "feature1.desc": "Cada archivo que subes se guarda directamente en un repositorio de GitHub que t\u00fa controlas. Confiable, versionado y siempre bajo tu propiedad.",
    "feature2.title": "Servicio r\u00e1pido tipo CDN",
    "feature2.desc": "Sirve cualquier archivo almacenado a trav\u00e9s de un endpoint limpio con cach\u00e9 de respuesta. Comparte enlaces p\u00fablicos o prot\u00e9gelos con API keys.",
    "feature3.title": "Acceso seguro",
    "feature3.desc": "Inicia sesi\u00f3n con Firebase Auth \u2014 email, Google o GitHub. Genera API keys con permisos espec\u00edficos para controlar qui\u00e9n puede leer o escribir tus archivos.",

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
    "file.confirm": "Confirmar",
    "file.copy": "Copiar",

    // Table headers
    "table.name": "Nombre",
    "table.type": "Tipo",
    "table.size": "Tama\u00f1o",
    "table.visibility": "Visibilidad",
    "table.deleteQ": "\u00bfEliminar?",
    "table.yes": "S\u00ed",
    "table.no": "No",

    // Vaults list page
    "vaults.title": "Vaults",
    "vaults.add": "+ Agregar vault",
    "vaults.empty": "A\u00fan no tienes vaults",
    "vaults.emptyDesc": "Conecta un repo existente de GitHub o crea uno nuevo para empezar.",
    "vaults.addFirst": "Agregar primer vault",
    "vaults.private": "Privado",
    "vaults.public": "P\u00fablico",
    "vaults.initializing": "inicializando\u2026",
    "vaults.addVault": "Agregar vault",
    "vaults.useExisting": "Usar repo existente",
    "vaults.createNew": "Crear nuevo repo",
    "vaults.ghNotConnected": "GitHub no est\u00e1 conectado",
    "vaults.ghInstallApp": "Instala la GitHub App para ver tus repositorios.",
    "vaults.redirecting": "Redirigiendo a GitHub\u2026",
    "vaults.connectGH": "Conectar GitHub",
    "vaults.alreadyInstalled": "\u00bfYa instalado? Actualizar",
    "vaults.loadFailed": "No se pudieron cargar los repositorios.",
    "vaults.retry": "Reintentar",
    "vaults.noRepos": "No hay repositorios disponibles.",
    "vaults.noReposDesc": "Aseg\u00farate de que la GitHub App tenga acceso a tus repos.",
    "vaults.searchRepo": "Buscar repositorio\u2026",
    "vaults.noResults": "Sin resultados para",
    "vaults.alreadyConnected": "ya conectado",
    "vaults.ghNoCreatePerm": "La GitHub App no tiene permisos para crear repositorios",
    "vaults.patPrompt": "Ingresa un Personal Access Token con scope repo para crear repos en tu nombre.",
    "vaults.pat": "Personal Access Token",
    "vaults.patPlaceholder": "ghp_xxxxxxxxxxxxxxxxxxxx",
    "vaults.createTokenGH": "Crear token en GitHub \u2197",
    "vaults.savingAndCreating": "Guardando y creando\u2026",
    "vaults.saveAndCreate": "Guardar token y crear repo",
    "vaults.cancel": "Cancelar",
    "vaults.willCreate": "Se crear\u00e1 un nuevo repositorio en tu cuenta de GitHub y se inicializar\u00e1 como vault de GitVault.",
    "vaults.repoName": "Nombre del repositorio",
    "vaults.repoPlaceholder": "mis-imagenes",
    "vaults.repoNameHint": "Solo letras, n\u00fameros, guiones y puntos. Sin espacios.",
    "vaults.visibility": "Visibilidad",
    "vaults.privateDesc": "Solo t\u00fa y tus apps",
    "vaults.publicCDN": "CDN directo, m\u00e1s r\u00e1pido",
    "vaults.creating": "Creando\u2026",
    "vaults.createRepoVault": "Crear repo y vault",
    "vaults.invalidName": "Nombre inv\u00e1lido. Usa letras, n\u00fameros, guiones o puntos.",
    "vaults.createError": "Error al crear el repositorio.",
    "vaults.createTokenError": "Error al crear el repositorio con el token.",

    // Apps page
    "apps.title": "Apps",
    "apps.new": "Nueva app",
    "apps.empty": "A\u00fan no hay apps.",
    "apps.emptyDesc": "Crea una app para obtener credenciales API para acceso program\u00e1tico.",
    "apps.active": "activa",
    "apps.inactive": "inactiva",
    "apps.newApp": "Nueva app",
    "apps.appName": "Nombre de la app",
    "apps.appNamePlaceholder": "Mi Integraci\u00f3n",
    "apps.scopes": "Permisos",
    "apps.vaultAccess": "Acceso a vaults",
    "apps.vaultAccessHint": "Deja todos sin marcar para dar acceso a todos los vaults.",
    "apps.createFailed": "Error al crear la app. Int\u00e9ntalo de nuevo.",
    "apps.creating": "Creando\u2026",
    "apps.createApp": "Crear app",

    // App detail page
    "app.notFound": "App no encontrada.",
    "app.deleteTitle": "\u00bfEliminar \"{name}\"?",
    "app.deleteWarning": "Todas las credenciales se revocar\u00e1n inmediatamente. Esto no se puede deshacer.",
    "app.deleting": "Eliminando\u2026",
    "app.yesDelete": "S\u00ed, eliminar app",
    "app.cancel": "Cancelar",
    "app.deleteApp": "Eliminar app",
    "app.scopes": "Permisos",
    "app.credentials": "Credenciales API",
    "app.generating": "Generando\u2026",
    "app.generateCred": "Generar credencial",
    "app.generateFailed": "Error al generar credencial. Int\u00e9ntalo de nuevo.",
    "app.saveSecret": "Guarda tu secreto ahora \u2014 no se mostrar\u00e1 de nuevo.",
    "app.apiKey": "API Key",
    "app.apiSecret": "API Secret",
    "app.useAs": "Usar como",
    "app.savedDismiss": "Ya lo guard\u00e9, cerrar",
    "app.noCreds": "A\u00fan no hay credenciales.",
    "app.created": "Creado",
    "app.revokeConfirm": "\u00bfRevocar esta key?",
    "app.revoking": "Revocando\u2026",
    "app.yesRevoke": "S\u00ed, revocar",
    "app.revoke": "Revocar",
    "app.failed": "Fall\u00f3",

    // Settings page
    "settings.title": "Ajustes",
    "settings.ghConnection": "Conexi\u00f3n de GitHub",
    "settings.ghConnectionDesc": "GitHub App instalada en tu cuenta para gestionar repositorios.",
    "settings.connected": "Conectado",
    "settings.notConnected": "No conectado",
    "settings.manageGH": "Administrar conexi\u00f3n de GitHub",
    "settings.redirecting": "Redirigiendo\u2026",
    "settings.connectGHApp": "Conectar GitHub App",
    "settings.refreshing": "Actualizando\u2026",
    "settings.refreshStatus": "Actualizar estado",
    "settings.pat": "Personal Access Token",
    "settings.patDesc": "Alternativa cuando la GitHub App no puede crear repositorios. Proporciona un PAT con scope repo.",
    "settings.configured": "Configurado",
    "settings.notConfigured": "No configurado",
    "settings.howToCreate": "C\u00f3mo crear el token:",
    "settings.step1": "Ve a github.com \u2192 Settings \u2192 Developer settings \u2192 Personal access tokens",
    "settings.step2": "Click en Generate new token (classic)",
    "settings.step3": "Selecciona el scope repo",
    "settings.step4": "Copia el token y p\u00e9galo aqu\u00ed",
    "settings.createTokenGH": "Crear token en GitHub \u2197",
    "settings.replaceToken": "Reemplazar token actual\u2026",
    "settings.saving": "Guardando\u2026",
    "settings.save": "Guardar",
    "settings.remove": "Eliminar",
    "settings.tokenSaved": "Token guardado correctamente.",
    "settings.tokenSaveFailed": "No se pudo guardar el token.",
    "settings.tokenRemoved": "Token eliminado.",
    "settings.tokenRemoveFailed": "No se pudo eliminar el token.",

    // Onboarding
    "onboarding.error": "No se pudo iniciar la conexi\u00f3n con GitHub. Int\u00e9ntalo de nuevo.",
    "onboarding.title": "Conectar GitHub",
    "onboarding.desc": "GitVault necesita acceso a tus repositorios de GitHub para usarlos como almacenamiento. Instala la GitHub App para comenzar.",
    "onboarding.redirecting": "Redirigiendo a GitHub\u2026",
    "onboarding.installApp": "Instalar GitHub App",
    "onboarding.checking": "Verificando\u2026",
    "onboarding.alreadyInstalled": "\u00bfYa instalada? Actualizar",

    // Onboarding select-repo
    "onboarding.connected": "\u00a1GitHub conectado!",
    "onboarding.redirectingVaults": "Redirigiendo a tus vaults\u2026",

    // Footer
    "footer.builtBy": "Creado por",
    "footer.openSource": "C\u00f3digo abierto en",
    "footer.terms": "T\u00e9rminos",
    "footer.privacy": "Privacidad",

    // Help
    "help.title": "Ayuda",
    "help.whatIs": "\u00bfQu\u00e9 es GitVault?",
    "help.whatIsDesc": "GitVault es una plataforma de almacenamiento que usa tus propios repositorios de GitHub como backend. Sube archivos y se guardan en un repo que t\u00fa controlas.",
    "help.howWorks": "\u00bfC\u00f3mo funciona?",
    "help.step1": "Conecta un repositorio de GitHub (nuevo o existente)",
    "help.step2": "Sube archivos desde el panel o la API",
    "help.step3": "Cada archivo se guarda en tu repo con deduplicaci\u00f3n SHA-256",
    "help.step4": "Obt\u00e9n una URL p\u00fablica para compartir o proteger con API keys",
    "help.vaults": "Vaults",
    "help.vaultsDesc": "Un vault es un repositorio de GitHub conectado a GitVault. Puedes conectar repos existentes o crear nuevos. Cada vault almacena archivos independientemente.",
    "help.apps": "Apps y API Keys",
    "help.appsDesc": "Crea apps para obtener credenciales API para acceso program\u00e1tico. Cada app puede tener permisos espec\u00edficos (lectura, escritura, eliminaci\u00f3n) y puede restringirse a vaults espec\u00edficos.",
    "help.publicPrivate": "Archivos p\u00fablicos vs privados",
    "help.publicDesc": "Los archivos p\u00fablicos se sirven directamente desde el CDN de GitHub \u2014 r\u00e1pido y gratis. Cualquiera con la URL puede accederlos.",
    "help.privateDesc": "Los archivos privados requieren autenticaci\u00f3n (Bearer token o API key) para acceder. Se transmiten a trav\u00e9s de la API de GitVault.",
    "help.api": "Uso de la API",
    "help.apiDesc": "Usa HTTP Basic auth con tu API key y secreto. Ejemplo:",
    "help.limits": "L\u00edmites",
    "help.limitsDesc": "Tama\u00f1o m\u00e1ximo: 10 MB por archivo. M\u00e1ximo por lote: 20 archivos. Aplican los l\u00edmites de la API de GitHub. Ideal para im\u00e1genes, documentos y archivos peque\u00f1os a medianos.",
    "help.close": "Cerrar",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
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
    (key: TranslationKey, params?: Record<string, string>) => {
      let value: string = translations[locale][key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, v);
        }
      }
      return value;
    },
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
