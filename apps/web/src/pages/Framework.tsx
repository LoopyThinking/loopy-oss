import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Layout } from '../components/Layout'

// ── TOC structure ─────────────────────────────────────────────────────────────

const sections = [
  { id: 'ciclo',       label: 'The loop cognitive cycle' },
  { id: 'signals',     label: 'Work Signals' },
  { id: 'confidence',  label: 'Confidence Index' },
  { id: 'ipl',         label: 'IPL — Liberated Productivity Index' },
  { id: 'scope',       label: 'Loop scope' },
  { id: 'faq',         label: 'FAQ' },
]

// ── Collapsible Q&A block ─────────────────────────────────────────────────────

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-edge rounded-xl overflow-hidden mb-2">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-primary hover:bg-hover transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span>{q}</span>
        {open
          ? <ChevronDown size={15} className="text-subtle shrink-0 ml-2" />
          : <ChevronRight size={15} className="text-subtle shrink-0 ml-2" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-secondary leading-relaxed border-t border-edge space-y-2">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="text-xl font-semibold text-primary mb-4">{title}</h2>
      <div className="space-y-3 text-sm text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  )
}

// ── Cognitive layer badge ─────────────────────────────────────────────────────

const layerColors: Record<string, string> = {
  perception:     'bg-sky-50     text-sky-700',
  interpretation: 'bg-violet-50  text-violet-700',
  decision:       'bg-amber-50   text-amber-700',
  action:         'bg-green-50   text-green-700',
  reflection:     'bg-rose-50    text-rose-700',
}

function LayerBadge({ layer, label }: { layer: string; label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${layerColors[layer]}`}>
      {label}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Framework() {
  const [activeSection, setActive] = useState('ciclo')

  function scrollTo(id: string) {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Layout
      title="Loopy Framework"
      breadcrumbs={[{ label: 'Framework' }]}
    >
      <div className="flex gap-8 max-w-5xl">

        {/* ── TOC — desktop ──────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-20">
            <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-3">
              Contents
            </p>
            <nav className="space-y-0.5">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === s.id
                      ? 'bg-accent-light text-accent font-medium'
                      : 'text-muted hover:text-primary hover:bg-hover'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
            <p className="mt-6 text-xs text-subtle leading-relaxed">
              Based on the Loopy framework v0.2 — subject to revision as the book evolves.
            </p>
          </div>
        </aside>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 max-w-[720px]">

          {/* ── Ciclo cognitivo ──────────────────────────────────────────── */}
          <Section id="ciclo" title="El ciclo cognitivo del loop">
            <p>
              Un <strong>loop</strong> es la unidad fundamental de trabajo en Loopy. No es una tarea
              ni un proyecto — es un <em>ciclo de pensamiento con consecuencias</em>. Cada loop tiene
              una hipótesis de partida y termina cuando esa hipótesis se confirma, refuta o transforma.
            </p>
            <p>
              El ciclo cognitivo tiene cinco capas. Las señales que emites dentro de un loop se
              clasifican en una de ellas:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
              {[
                { layer: 'perception',     emoji: '👁️', title: 'Percepción',     desc: 'Observar y capturar información del entorno. "Noté que…", "El dato muestra…"' },
                { layer: 'interpretation', emoji: '🧠', title: 'Interpretación', desc: 'Procesar y dar sentido. "Esto significa que…", "El patrón indica…"' },
                { layer: 'decision',       emoji: '⚡', title: 'Decisión',       desc: 'Elegir un curso de acción. "Decidí hacer X porque…"' },
                { layer: 'action',         emoji: '🔧', title: 'Acción',         desc: 'Ejecutar. "Hice X", "El agente corrió Y"' },
                { layer: 'reflection',     emoji: '🔄', title: 'Reflexión',      desc: 'Aprender del resultado. "En retrospectiva…", "La hipótesis era…"' },
              ].map(({ layer, emoji, title, desc }) => (
                <div key={layer} className="border border-edge rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{emoji}</span>
                    <LayerBadge layer={layer} label={title} />
                  </div>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
              ))}
            </div>

            <p>
              El ciclo no es lineal. Un loop puede ir de Percepción a Decisión sin pasar por
              Interpretación, o volver a Percepción después de una Acción. Lo que importa es que
              cada señal sitúe el trabajo en el mapa cognitivo correcto.
            </p>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mt-4">
              <p className="font-medium text-indigo-800 text-sm mb-1">Ejemplo concreto</p>
              <p className="text-xs text-indigo-700">
                <strong>Loop:</strong> "Investigar por qué la tasa de activación del skill cayó un 30% esta semana"<br />
                <strong>Hipótesis:</strong> "Posiblemente hay un bug en la detección de keywords del skill-creator"<br /><br />
                <strong>1.</strong> <em>Percepción</em> — El agente detecta la caída en los logs de activación.<br />
                <strong>2.</strong> <em>Interpretación</em> — El análisis muestra que el patrón empezó el martes, coincidiendo con un deploy.<br />
                <strong>3.</strong> <em>Decisión</em> — Revisar el commit del martes y hacer rollback si se confirma.<br />
                <strong>4.</strong> <em>Acción</em> — El agente revierte el cambio en la función de matching.<br />
                <strong>5.</strong> <em>Reflexión</em> — La hipótesis era correcta. La función tenía un regex que descartaba matches parciales.
              </p>
            </div>
          </Section>

          {/* ── Work Signals ─────────────────────────────────────────────── */}
          <Section id="signals" title="Work Signals">
            <p>
              Una <strong>Work Signal</strong> es la unidad atómica de registro en Loopy. Es evidencia
              de que algo ocurrió dentro de un loop — ya sea emitida por un humano o por un agente.
            </p>
            <p>
              Cada señal tiene tres propiedades esenciales:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-secondary ml-2">
              <li><strong>type</strong> — la capa cognitiva (perception, interpretation, decision, action, reflection)</li>
              <li><strong>source</strong> — quién la emite: <code className="text-xs bg-elevated px-1 py-0.5 rounded">human</code> o <code className="text-xs bg-elevated px-1 py-0.5 rounded">agent</code></li>
              <li><strong>content</strong> — descripción legible de lo que ocurrió</li>
            </ul>
            <p className="mt-2">
              Las señales de tipo <code className="text-xs bg-elevated px-1 py-0.5 rounded">agent</code> tienen peso adicional en el Confidence Index y
              contribuyen al IPL. Las señales humanas son el contexto; las del agente son el trabajo delegado.
            </p>
            <p>
              Una buena señal describe un hecho concreto y observable, no una intención. "El agente
              analizó 47 commits y encontró el offending PR" es una señal. "El agente va a revisar el
              código" no lo es — eso es una señal de intención sin evidencia.
            </p>
          </Section>

          {/* ── Confidence Index ─────────────────────────────────────────── */}
          <Section id="confidence" title="Confidence Index">
            <p>
              El <strong>Confidence Index</strong> (0–100) mide qué tan respaldada está la hipótesis
              de un loop por la evidencia acumulada. No es un score de calidad ni de éxito — es una
              herramienta de gobernanza.
            </p>
            <p>
              La fórmula OSS usa pesos deterministas por tipo de señal. Las señales más "decisivas"
              (decision, reflection) pesan más que las exploratorias (perception):
            </p>
            <div className="bg-surface rounded-xl p-4 font-mono text-xs text-secondary space-y-1">
              <div>perception:     <span className="text-accent font-semibold">8 pts</span></div>
              <div>interpretation: <span className="text-accent font-semibold">12 pts</span></div>
              <div>decision:       <span className="text-accent font-semibold">20 pts</span></div>
              <div>action:         <span className="text-accent font-semibold">10 pts</span></div>
              <div>reflection:     <span className="text-accent font-semibold">15 pts</span></div>
              <div className="pt-2 text-subtle">MAX(100, suma de señales) → normalizado a 0–100</div>
            </div>
            <p className="mt-3">
              Un loop con Confidence Index bajo ({"<"}40) no necesariamente está mal — puede
              estar en fase exploratoria temprana. Lo que señala es que todavía no hay suficiente
              evidencia para cerrar con confianza. Un índice alto ({">"} 75) indica que el loop está
              listo para cierre o que la hipótesis tiene respaldo sólido.
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-3">
              <p className="text-sm font-medium text-amber-800 mb-1">Lo que el Confidence Index NO es</p>
              <p className="text-xs text-amber-700">
                No mide si la hipótesis era correcta. Un loop puede cerrarse con Confidence 90 y una
                hipótesis equivocada — eso es un resultado valioso (aprendiste qué no funciona). El índice
                mide el esfuerzo de documentación y razonamiento, no la calidad del outcome.
              </p>
            </div>
          </Section>

          {/* ── IPL ──────────────────────────────────────────────────────── */}
          <Section id="ipl" title="IPL — Índice de Productividad Liberada">
            <p>
              El <strong>IPL</strong> mide cuántas horas-equivalente de trabajo humano ejecutaron
              los agentes dentro de un loop. Es una métrica de delegación efectiva, no de
              automatización total.
            </p>
            <p>
              La versión OSS usa una heurística de pesos por tipo de señal del agente:
            </p>
            <div className="bg-surface rounded-xl p-4 font-mono text-xs text-secondary space-y-1">
              <div>perception agent:     <span className="text-violet-600 font-semibold">3 min</span></div>
              <div>interpretation agent: <span className="text-violet-600 font-semibold">8 min</span></div>
              <div>decision agent:       <span className="text-violet-600 font-semibold">15 min</span></div>
              <div>action agent:         <span className="text-violet-600 font-semibold">10 min</span></div>
              <div>reflection agent:     <span className="text-violet-600 font-semibold">6 min</span></div>
              <div className="pt-2 text-subtle">Las señales humanas NO contribuyen al IPL.</div>
            </div>
            <p className="mt-3">
              Los pesos son calibrables. Si tu agente emite señales de tipo <em>decision</em> para
              registrar una decisión que en realidad tomó 2 minutos, puedes pasar
              <code className="text-xs bg-elevated px-1 py-0.5 rounded ml-1 mr-1">estimatedHumanMinutes</code>
              en el metadata de la señal para sobrescribir la heurística.
            </p>
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mt-3">
              <p className="text-sm font-medium text-violet-800 mb-1">Lo que el IPL NO mide</p>
              <p className="text-xs text-violet-700">
                El IPL no mide calidad, outcome ni si el trabajo del agente fue correcto. Tampoco es
                comparable entre instancias distintas de Loopy OSS, ya que los pesos son configurables.
                Úsalo como indicador interno de delegación, no como benchmark absoluto.
              </p>
            </div>
          </Section>

          {/* ── Scope ────────────────────────────────────────────────────── */}
          <Section id="scope" title="Scope de un loop">
            <p>
              El scope define la visibilidad y el contexto organizacional de un loop. Hay tres niveles:
            </p>

            <div className="space-y-3 mt-3">
              {[
                {
                  scope: 'personal',
                  color: 'bg-blue-50 border-blue-100 text-blue-800',
                  subColor: 'text-blue-600',
                  title: 'Personal',
                  desc: 'Solo tú tienes acceso. Úsalo para trabajo reflexivo individual, decisiones propias, exploración de ideas que aún no están listas para compartir.',
                  when: 'Usa personal cuando el trabajo involucra solo tu agente y no tiene impacto directo en otros.',
                },
                {
                  scope: 'team',
                  color: 'bg-green-50 border-green-100 text-green-800',
                  subColor: 'text-green-600',
                  title: 'Team',
                  desc: 'Visible para los miembros de tu organización. Úsalo cuando necesitas coordinación, revisión o cuando el resultado afecta a otros del equipo.',
                  when: 'Usa team cuando el loop requiere input de otro miembro o cuando las señales documentan trabajo compartido.',
                },
                {
                  scope: 'organizational',
                  color: 'bg-amber-50 border-amber-100 text-amber-800',
                  subColor: 'text-amber-600',
                  title: 'Organizational',
                  desc: 'Loops con impacto en toda la organización. Decisiones estratégicas, cambios de proceso, retrospectivas cross-team.',
                  when: 'Reserva organizational para loops que un admin necesita monitorear en el panel ejecutivo por su alcance o impacto.',
                },
              ].map(({ scope, color, subColor, title, desc, when }) => (
                <div key={scope} className={`border rounded-xl p-4 ${color}`}>
                  <p className="text-sm font-semibold mb-1">{title}</p>
                  <p className="text-xs mb-2">{desc}</p>
                  <p className={`text-xs font-medium ${subColor}`}>{when}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          <Section id="faq" title="Preguntas frecuentes">
            <QA q="¿Cuándo cierro un loop?">
              <p>Cuando la hipótesis tiene una respuesta — no necesariamente la respuesta que esperabas. Cierra con una
              resolución que capture qué aprendiste: "La hipótesis era incorrecta, el problema real era X", o "La
              hipótesis se confirmó, el resultado es Y".</p>
              <p>No esperes a tener certeza absoluta. Un loop cerrado con Confidence 60 y una buena resolución
              es más valioso que un loop abierto esperando la señal perfecta que nunca llega.</p>
            </QA>

            <QA q="¿Puede un loop quedarse abierto indefinidamente?">
              <p>Técnicamente sí. En la práctica, un loop abierto durante más de 30 días sin señales nuevas
              suele ser una señal de que el loop perdió relevancia, cambió de forma o debería cerrarse como "bloqueado".</p>
              <p>Usa el estado <code className="text-xs bg-elevated px-1 py-0.5 rounded">blocked</code> cuando el loop
              no puede avanzar por una dependencia externa. Es más honesto que dejarlo abierto silenciosamente.</p>
            </QA>

            <QA q="¿Qué pasa si la hipótesis cambia a mitad del loop?">
              <p>Es normal y esperado. Emite una señal de tipo <em>interpretation</em> o <em>reflection</em> que
              documente el cambio: "La hipótesis inicial era X, pero la evidencia indica que el problema real es Y.
              Redefiniendo el foco del loop."</p>
              <p>No abras un loop nuevo — el cambio de hipótesis es parte del ciclo cognitivo, no un error. El nuevo
              foco queda documentado en la señal, y el Confidence Index se recalcula sobre el total de señales.</p>
            </QA>

            <QA q="¿Un loop puede tener sub-loops?">
              <p>En la versión OSS no existe una relación parent/child de loops a nivel de schema. La convención es
              referenciar el loop padre en el título o en el contenido de la señal: "Sub-tarea de loop [id]".</p>
              <p>Si necesitas jerarquía explícita, es una buena candidata para contribuir al OSS — el schema lo
              admitiría con una columna <code className="text-xs bg-elevated px-1 py-0.5 rounded">parent_loop_id</code> nullable.</p>
            </QA>

            <QA q="¿Cómo sé si una señal va o no va en un loop?">
              <p>Pregúntate: ¿esta señal es evidencia de que el loop avanzó? Si la respuesta es sí, va. Si es
              solo un comentario o contexto que no mueve la hipótesis ni la acción, probablemente no necesita
              ser registrada como señal — o pertenece a otro loop.</p>
              <p>Una buena heurística: si no puedes asignarle una capa cognitiva clara (perception, interpretation,
              decision, action, reflection), es probable que la señal sea demasiado vaga para ser útil.</p>
            </QA>

            <QA q="¿Cuántos loops activos es razonable tener a la vez?">
              <p>Depende del contexto, pero si superas 10 loops activos en paralelo para un solo usuario, es señal
              de que algunos deberían ser bloqueados o cerrados. El valor de Loopy viene de la atención sostenida,
              no del volumen de loops abiertos.</p>
              <p>Los agentes pueden manejar más loops simultáneos porque no sufren carga cognitiva, pero la revisión
              humana del Confidence Index de cada loop sí tiene costo. Menos loops, mejor atendidos, produce mejores
              retrospectivas.</p>
            </QA>
          </Section>

          <p className="text-xs text-subtle pb-8">
            Based on the Loopy framework v0.2 · The content on this page is conceptual reference from the book,
            not software documentation. For API and SDK reference, see{' '}
            <a href="https://docs.loopythinking.dev" className="underline hover:text-muted" target="_blank" rel="noopener noreferrer">
              docs.loopythinking.dev
            </a>.
          </p>
        </div>
      </div>
    </Layout>
  )
}
