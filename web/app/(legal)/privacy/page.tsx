import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — GitVault",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8">
          <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            ← Back / Volver
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-xl text-zinc-500 mb-2">Política de Privacidad</p>
        <p className="text-sm text-zinc-400 mb-10">Last updated / Última actualización: April 2026</p>

        {/* English */}
        <section className="mb-14">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-zinc-400 mb-6">English</h2>

          <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">1. Information We Collect</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Account data:</strong> email address and display name via Google/GitHub login (Firebase Authentication).</li>
                <li><strong>GitHub data:</strong> GitHub installation ID to interact with your repositories on your behalf.</li>
                <li><strong>File metadata:</strong> file names, sizes, content types, and visibility settings for files you upload.</li>
                <li><strong>Usage logs:</strong> server request logs (IP address, endpoint, timestamp) retained for operational purposes.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2. How We Use Your Information</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>To authenticate you and provide the service.</li>
                <li>To store and retrieve your files in your GitHub repository.</li>
                <li>To generate public or private access URLs for your files.</li>
              </ul>
              <p className="mt-2">We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">3. File Storage</h3>
              <p>
                Files are stored in <strong>your own GitHub repository</strong>. GitVault does not retain copies of file contents — it only stores metadata (name, size, type, visibility). The actual file data lives in your GitHub account.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">4. Third-Party Services</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Firebase (Google):</strong> handles authentication. Subject to <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="underline">Google&apos;s Privacy Policy</a>.</li>
                <li><strong>GitHub:</strong> stores file data in your repositories. Subject to <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" className="underline">GitHub&apos;s Privacy Statement</a>.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">5. Data Retention</h3>
              <p>Account and metadata are retained until you delete your account. File data remains in your GitHub repository and is subject to GitHub&apos;s retention policies.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">6. Security</h3>
              <p>We use industry-standard practices including HTTPS, encrypted tokens, and hashed credentials. However, no system is 100% secure. Use GitVault at your own risk.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">7. Your Rights</h3>
              <p>You may request deletion of your account and associated metadata at any time by contacting the administrator. File data stored in your GitHub repository must be deleted by you directly.</p>
            </div>
          </div>
        </section>

        <hr className="border-zinc-200 dark:border-zinc-800 mb-14" />

        {/* Español */}
        <section className="mb-14">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-zinc-400 mb-6">Español</h2>

          <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">1. Información que Recopilamos</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Datos de cuenta:</strong> correo electrónico y nombre de pantalla a través de Google/GitHub (Firebase Authentication).</li>
                <li><strong>Datos de GitHub:</strong> ID de instalación de GitHub para interactuar con tus repositorios en tu nombre.</li>
                <li><strong>Metadatos de archivos:</strong> nombres, tamaños, tipos de contenido y configuraciones de visibilidad de los archivos que subes.</li>
                <li><strong>Registros de uso:</strong> logs de solicitudes del servidor (IP, endpoint, timestamp) para fines operativos.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2. Cómo Usamos tu Información</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Para autenticarte y proporcionar el servicio.</li>
                <li>Para almacenar y recuperar tus archivos en tu repositorio de GitHub.</li>
                <li>Para generar URLs de acceso público o privado a tus archivos.</li>
              </ul>
              <p className="mt-2">No vendemos, alquilamos ni compartimos tu información personal con terceros para fines de marketing.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">3. Almacenamiento de Archivos</h3>
              <p>
                Los archivos se almacenan en <strong>tu propio repositorio de GitHub</strong>. GitVault no retiene copias del contenido de los archivos — solo almacena metadatos (nombre, tamaño, tipo, visibilidad). Los datos reales de los archivos viven en tu cuenta de GitHub.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">4. Servicios de Terceros</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Firebase (Google):</strong> maneja la autenticación. Sujeto a la Política de Privacidad de Google.</li>
                <li><strong>GitHub:</strong> almacena los datos de archivos en tus repositorios. Sujeto a la Declaración de Privacidad de GitHub.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">5. Retención de Datos</h3>
              <p>La cuenta y los metadatos se retienen hasta que elimines tu cuenta. Los datos de archivos permanecen en tu repositorio de GitHub y están sujetos a las políticas de retención de GitHub.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">6. Seguridad</h3>
              <p>Utilizamos prácticas estándar de la industria incluyendo HTTPS, tokens encriptados y credenciales hasheadas. Sin embargo, ningún sistema es 100% seguro. Usa GitVault bajo tu propia responsabilidad.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">7. Tus Derechos</h3>
              <p>Puedes solicitar la eliminación de tu cuenta y metadatos asociados en cualquier momento contactando al administrador. Los datos de archivos almacenados en tu repositorio de GitHub deben ser eliminados directamente por ti.</p>
            </div>
          </div>
        </section>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 text-xs text-zinc-400">
          <p>
            Created by / Creado por{" "}
            <a href="https://dudiver.net" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600">
              Roberth Dudiver
            </a>{" "}
            · <Link href="/terms" className="underline hover:text-zinc-600">Terms of Service</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
