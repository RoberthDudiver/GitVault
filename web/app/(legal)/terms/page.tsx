import Link from "next/link";

export const metadata = {
  title: "Terms of Service — GitVault",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8">
          <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            ← Back / Volver
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-xl text-zinc-500 mb-2">Términos y Condiciones</p>
        <p className="text-sm text-zinc-400 mb-10">Last updated / Última actualización: April 2026</p>

        {/* English */}
        <section className="mb-14">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-zinc-400 mb-6">English</h2>

          <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">1. Acceptance of Terms</h3>
              <p>By accessing or using GitVault you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2. No Warranty &amp; Limitation of Liability</h3>
              <p>
                GitVault is provided <strong>"as is"</strong> without warranty of any kind, express or implied. The author and contributors shall not be held liable for any direct, indirect, incidental, special, or consequential damages arising from the use or inability to use the service, including but not limited to data loss, unauthorized access, service interruptions, or misuse of the platform by any party.
              </p>
              <p className="mt-2">
                <strong>You are solely responsible for the files you upload, how you use the service, and any consequences resulting from that use.</strong> The operators of this service are not responsible for illegal content, copyright violations, or any harm caused by files stored through GitVault.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">3. Open Source</h3>
              <p>
                The complete source code of GitVault is publicly available on GitHub. The software is provided for transparency and community improvement. By accessing the source code you agree to the terms of the project license (see below).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">4. License &amp; Permitted Use</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>You may use, study, and modify GitVault for <strong>personal and non-commercial</strong> purposes.</li>
                <li>Functional changes and improvements must be submitted as a <strong>Pull Request</strong> to the original repository.</li>
                <li>You <strong>may not sell, license, or sublicense</strong> GitVault or any derivative work without explicit written authorization from the original author.</li>
                <li>Commercial use of GitVault or any fork derived from it is <strong>not permitted</strong> without prior written authorization.</li>
                <li>All copies and derivatives must retain the original <strong>attribution</strong> to the author.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">5. User Conduct</h3>
              <p>You agree not to use GitVault to store, distribute, or transmit unlawful, harmful, threatening, abusive, or otherwise objectionable content. The service operator reserves the right to terminate accounts that violate these terms.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">6. Third-Party Services</h3>
              <p>GitVault relies on GitHub for file storage and Firebase for authentication. Your use of those services is subject to their respective terms. GitVault is not affiliated with or endorsed by GitHub or Google.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">7. Changes to Terms</h3>
              <p>These terms may be updated at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-zinc-200 dark:border-zinc-800 mb-14" />

        {/* Español */}
        <section className="mb-14">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-zinc-400 mb-6">Español</h2>

          <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">1. Aceptación de los Términos</h3>
              <p>Al acceder o usar GitVault, aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo, no uses el servicio.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">2. Sin Garantía y Limitación de Responsabilidad</h3>
              <p>
                GitVault se proporciona <strong>"tal cual"</strong> sin garantía de ningún tipo, expresa o implícita. El autor y los colaboradores no serán responsables de ningún daño directo, indirecto, incidental, especial o consecuente que surja del uso o la imposibilidad de uso del servicio, incluyendo pero no limitado a pérdida de datos, acceso no autorizado, interrupciones del servicio o mal uso de la plataforma por cualquier parte.
              </p>
              <p className="mt-2">
                <strong>Eres el único responsable de los archivos que subes, cómo usas el servicio y cualquier consecuencia derivada de ese uso.</strong> Los operadores de este servicio no son responsables de contenido ilegal, violaciones de derechos de autor, ni de ningún daño causado por archivos almacenados a través de GitVault.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">3. Código Abierto</h3>
              <p>El código fuente completo de GitVault está disponible públicamente en GitHub. El software se provee para transparencia y mejora comunitaria. Al acceder al código fuente aceptas los términos de la licencia del proyecto (ver abajo).</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">4. Licencia y Uso Permitido</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Puedes usar, estudiar y modificar GitVault para fines <strong>personales y no comerciales</strong>.</li>
                <li>Los cambios funcionales y mejoras deben enviarse como <strong>Pull Request</strong> al repositorio original.</li>
                <li><strong>No puedes vender, licenciar ni sublicenciar</strong> GitVault ni ninguna obra derivada sin autorización escrita del autor original.</li>
                <li>El uso comercial de GitVault o cualquier fork derivado <strong>no está permitido</strong> sin autorización previa por escrito.</li>
                <li>Todas las copias y derivados deben mantener la <strong>atribución</strong> al autor original.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">5. Conducta del Usuario</h3>
              <p>Aceptas no usar GitVault para almacenar, distribuir o transmitir contenido ilegal, dañino, amenazante, abusivo u objetable. El operador del servicio se reserva el derecho de cancelar cuentas que violen estos términos.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">6. Servicios de Terceros</h3>
              <p>GitVault depende de GitHub para el almacenamiento de archivos y Firebase para la autenticación. Tu uso de esos servicios está sujeto a sus propios términos. GitVault no tiene afiliación ni está respaldado por GitHub ni Google.</p>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">7. Cambios en los Términos</h3>
              <p>Estos términos pueden actualizarse en cualquier momento. El uso continuado del servicio tras los cambios implica aceptación de los nuevos términos.</p>
            </div>
          </div>
        </section>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 text-xs text-zinc-400">
          <p>
            Created by / Creado por{" "}
            <a href="https://dudiver.net" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600">
              Roberth Dudiver
            </a>{" "}
            · <Link href="/privacy" className="underline hover:text-zinc-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
