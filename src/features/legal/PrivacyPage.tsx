import { useNavigate } from 'react-router';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="glass sticky top-0 z-20 flex items-center gap-3 border-b border-border/40 px-5 py-3.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-[#2bd4bd] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Política de Privacidad</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 pb-24 md:pb-8">
        <div className="prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80 max-w-none">
          <p className="text-xs text-muted-foreground mb-6">Última actualización: 12 de agosto de 2026</p>

          <h2>1. Información que recopilamos</h2>
          <p>
            Trainlog recopila la siguiente información cuando utilizas la aplicación:
          </p>
          <ul>
            <li><strong>Datos de autenticación:</strong> Tu dirección de correo electrónico y nombre proporcionados por Google al iniciar sesión con Google OAuth.</li>
            <li><strong>Entradas de diario:</strong> El texto transcrito de tus grabaciones de voz, junto con el análisis estructurado generado por inteligencia artificial (temas, nivel de energía, estado de ánimo, actividades detectadas).</li>
            <li><strong>Datos de perfil:</strong> Nombre, sexo y fecha de nacimiento, si decides proporcionarlos.</li>
            <li><strong>Artículos guardados:</strong> Los artículos que decidas guardar en tu biblioteca personal.</li>
            <li><strong>Historial de chat:</strong> Las conversaciones con el Coach IA se mantienen durante la sesión del navegador.</li>
          </ul>

          <h2>2. Grabaciones de voz</h2>
          <p>
            Las grabaciones de voz se procesan para obtener una transcripción de texto. <strong>El audio no se almacena como archivo</strong> en ningún servidor. Una vez transcrito, el archivo de audio se descarta. Solo el texto resultante se conserva si el usuario decide confirmarlo.
          </p>

          <h2>3. Cómo usamos tu información</h2>
          <p>Tu información se utiliza exclusivamente para:</p>
          <ul>
            <li>Proporcionar la funcionalidad de la aplicación (diario, análisis, recomendaciones).</li>
            <li>Generar análisis personalizados mediante inteligencia artificial.</li>
            <li>Personalizar las recomendaciones de contenido educativo.</li>
          </ul>
          <p>
            <strong>No vendemos, compartimos ni cedemos tus datos personales a terceros con fines comerciales.</strong>
          </p>

          <h2>4. Servicios de terceros</h2>
          <p>Trainlog utiliza los siguientes servicios externos para su funcionamiento:</p>
          <ul>
            <li><strong>Firebase (Google):</strong> Autenticación de usuarios y almacenamiento de datos (Firestore).</li>
            <li><strong>Groq:</strong> Transcripción de voz a texto mediante el modelo Whisper.</li>
            <li><strong>Google Gemini:</strong> Generación de análisis, respuestas contextuales, artículos y coaching IA.</li>
            <li><strong>Vercel:</strong> Alojamiento de la aplicación y funciones serverless.</li>
          </ul>
          <p>
            Estos servicios pueden procesar datos según sus propias políticas de privacidad. Las llamadas a Groq y Gemini se realizan desde funciones del servidor y nunca exponen claves de API al navegador del usuario.
          </p>

          <h2>5. Seguridad de los datos</h2>
          <p>Implementamos las siguientes medidas de seguridad:</p>
          <ul>
            <li>Autenticación mediante Google OAuth 2.0.</li>
            <li>Las reglas de seguridad de Firestore garantizan que cada usuario solo puede acceder a sus propios datos.</li>
            <li>Los tokens de autenticación se verifican en el servidor antes de procesar cualquier solicitud.</li>
            <li>Las claves de API nunca se exponen en el frontend.</li>
            <li>Las respuestas de IA se validan con esquemas Zod antes de ser almacenadas.</li>
          </ul>

          <h2>6. Tus derechos</h2>
          <p>Como usuario de Trainlog, tienes derecho a:</p>
          <ul>
            <li><strong>Acceder</strong> a todos tus datos a través de la función de exportación en tu perfil.</li>
            <li><strong>Eliminar</strong> tu cuenta y todos los datos asociados desde la sección «Zona Peligrosa» en tu perfil.</li>
            <li><strong>Rectificar</strong> tus datos de perfil en cualquier momento.</li>
          </ul>

          <h2>7. Retención de datos</h2>
          <p>
            Tus datos se conservan mientras mantengas tu cuenta activa. Al eliminar tu cuenta, todos los datos asociados (entradas, artículos guardados, perfil, preferencias) se eliminan permanentemente de nuestros servidores.
          </p>

          <h2>8. Menores de edad</h2>
          <p>
            Trainlog no está dirigida a menores de 16 años. No recopilamos conscientemente información de menores de esta edad.
          </p>

          <h2>9. Cambios en esta política</h2>
          <p>
            Nos reservamos el derecho de actualizar esta política de privacidad. Los cambios se publicarán en esta misma página con una fecha de actualización revisada.
          </p>

          <h2>10. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta política de privacidad, puedes contactarnos en:{' '}
            <a href="mailto:ruedarosasdavid@gmail.com" className="text-primary hover:underline">
              ruedarosasdavid@gmail.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
