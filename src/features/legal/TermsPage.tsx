import { useNavigate } from 'react-router';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TermsPage() {
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
          <FileText className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Términos de Uso</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 pb-24 md:pb-8">
        <div className="prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80 max-w-none">
          <p className="text-xs text-muted-foreground mb-6">Última actualización: 12 de agosto de 2026</p>

          <h2>1. Aceptación de los términos</h2>
          <p>
            Al acceder y utilizar Trainlog, aceptas quedar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguno de estos términos, no utilices la aplicación.
          </p>

          <h2>2. Descripción del servicio</h2>
          <p>
            Trainlog es una aplicación de diario de reflexión deportiva basada en voz. Permite a los usuarios grabar notas de voz sobre sus entrenamientos, obtener transcripciones y análisis generados por inteligencia artificial, explorar contenido educativo personalizado e interactuar con un coach virtual.
          </p>

          <h2>3. Aviso médico importante</h2>
          <p>
            <strong>Trainlog no es una aplicación médica, un dispositivo de diagnóstico ni un sustituto de un profesional de la salud.</strong>
          </p>
          <ul>
            <li>El contenido generado por inteligencia artificial es <strong>informativo y educativo</strong>, nunca prescriptivo.</li>
            <li>Los análisis, recomendaciones y respuestas del coach IA no constituyen consejo médico, nutricional, psicológico ni de entrenamiento profesional.</li>
            <li>No diagnostica lesiones, condiciones médicas ni condiciones psicológicas.</li>
            <li>No prescribe tratamientos ni presenta interpretaciones de IA como conclusiones clínicas.</li>
            <li>Consulta siempre con un profesional cualificado antes de tomar decisiones relacionadas con tu salud o entrenamiento.</li>
          </ul>

          <h2>4. Uso aceptable</h2>
          <p>Al utilizar Trainlog, te comprometes a:</p>
          <ul>
            <li>Usar la aplicación de manera responsable y para los fines previstos.</li>
            <li>Proporcionar información veraz en tu perfil.</li>
            <li>No intentar acceder a datos de otros usuarios.</li>
            <li>No utilizar la aplicación para fines ilegales o dañinos.</li>
            <li>No realizar ingeniería inversa, descompilar ni intentar extraer el código fuente.</li>
          </ul>

          <h2>5. Contenido generado por IA</h2>
          <p>
            Los análisis, artículos, recomendaciones y respuestas del coach son generados automáticamente por modelos de inteligencia artificial. Estos contenidos:
          </p>
          <ul>
            <li>Pueden contener imprecisiones o información incompleta.</li>
            <li>No han sido revisados por profesionales médicos o deportivos.</li>
            <li>Se proporcionan «tal cual», sin garantía de exactitud, completitud ni idoneidad.</li>
            <li>No deben ser la única base para tomar decisiones sobre salud o entrenamiento.</li>
          </ul>

          <h2>6. Propiedad intelectual</h2>
          <p>
            Todo el contenido, diseño, código y funcionalidad de Trainlog son propiedad de David Rueda y están protegidos por las leyes de propiedad intelectual aplicables. Los datos que generas (entradas de diario, transcripciones) son de tu propiedad.
          </p>

          <h2>7. Disponibilidad del servicio</h2>
          <p>
            Trainlog se ofrece «tal cual» y «según disponibilidad». No garantizamos que el servicio esté disponible de forma ininterrumpida, libre de errores o seguro en todo momento. Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio en cualquier momento.
          </p>

          <h2>8. Limitación de responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley, Trainlog y su desarrollador no serán responsables de daños directos, indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso de la aplicación, incluyendo pero no limitado a lesiones, decisiones de entrenamiento inadecuadas o pérdida de datos.
          </p>

          <h2>9. Modificación de los términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios se publicarán en esta página con una fecha de actualización revisada. El uso continuado de la aplicación después de la publicación de cambios constituye la aceptación de los términos modificados.
          </p>

          <h2>10. Ley aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de España. Cualquier disputa se someterá a la jurisdicción de los tribunales competentes de España.
          </p>

          <h2>11. Contacto</h2>
          <p>
            Para cualquier consulta sobre estos términos, contacta con nosotros en:{' '}
            <a href="mailto:ruedarosasdavid@gmail.com" className="text-primary hover:underline">
              ruedarosasdavid@gmail.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
