type Sheet = Record<string, unknown>

const STEPS = ["CONCEPT", "CHARACTERISTICS", "DERIVED", "OCCUPATION", "SKILLS", "BACKSTORY", "FINALIZE"]

const STEP_LABELS: Record<string, string> = {
  CONCEPT:         "Concept",
  CHARACTERISTICS: "Characteristics",
  DERIVED:         "Derived Attrs",
  OCCUPATION:      "Occupation",
  SKILLS:          "Skills",
  BACKSTORY:       "Backstory",
  FINALIZE:        "Finalized",
}

const STAT_KEYS   = ["STR", "CON", "SIZ", "DEX", "APP", "INT", "POW", "EDU"]
const DERIVED_KEYS: Array<[keyof Sheet, string]> = [
  ["HP",          "HP"],
  ["sanity",      "Sanity"],
  ["luck",        "Luck"],
  ["magicPoints", "Magic Points"],
  ["damageBonus", "Damage Bonus"],
  ["build",       "Build"],
]
const BACKSTORY_KEYS: Array<[keyof Sheet, string]> = [
  ["ideology",           "Ideology"],
  ["significantPerson",  "Significant Person"],
  ["meaningfulLocation", "Meaningful Location"],
  ["treasuredPossession","Treasured Possession"],
  ["trait",              "Trait"],
]

function Row({ label, value }: { label: string; value: unknown }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex justify-between gap-2 text-xs py-0.5">
      <span className="text-[var(--secondary-text-color)] shrink-0">{label}</span>
      <span className="text-right font-medium break-words">{String(value)}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] uppercase tracking-widest text-[var(--theme-color)] mb-1 font-semibold">{title}</p>
      <div className="border border-[var(--border-color)] rounded-lg px-3 py-2 space-y-0.5">
        {children}
      </div>
    </div>
  )
}

export default function CharacterSheet({
  currentStep,
  sheet,
}: {
  currentStep: string
  sheet: Sheet
}) {
  const stepIdx    = STEPS.indexOf(currentStep)
  const isComplete = currentStep === "FINALIZE" && Object.keys(sheet).length > 0

  const skills = sheet.skills as Record<string, number> | undefined

  return (
    <aside className="flex flex-col h-full overflow-hidden border-l border-[var(--border-color)] bg-[var(--sidebar-color)]">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-[var(--border-color)]">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--theme-color)]">Character Sheet</p>
        <p className="text-[11px] text-[var(--secondary-text-color)] mt-0.5">
          {isComplete ? "✓ Complete" : `Step ${stepIdx + 1} / ${STEPS.length} — ${STEP_LABELS[currentStep] ?? currentStep}`}
        </p>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--theme-color)] transition-all duration-500"
            style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Sheet content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {Object.keys(sheet).length === 0 ? (
          <p className="text-xs text-[var(--secondary-text-color)] text-center mt-6 leading-relaxed">
            Your character sheet will fill in here as you answer each step.
          </p>
        ) : (
          <>
            {/* Identity */}
            {(sheet.name || sheet.age || sheet.background) && (
              <Section title="Identity">
                <Row label="Name"       value={sheet.name} />
                <Row label="Age"        value={sheet.age} />
                <Row label="Background" value={sheet.background} />
                <Row label="Appearance" value={sheet.appearance} />
              </Section>
            )}

            {/* Characteristics */}
            {STAT_KEYS.some(k => sheet[k] !== undefined) && (
              <Section title="Characteristics">
                <div className="grid grid-cols-2 gap-x-4">
                  {STAT_KEYS.map(k => (
                    sheet[k] !== undefined && (
                      <div key={k} className="flex justify-between text-xs py-0.5">
                        <span className="text-[var(--secondary-text-color)]">{k}</span>
                        <span className="font-bold">{String(sheet[k])}</span>
                      </div>
                    )
                  ))}
                </div>
              </Section>
            )}

            {/* Derived */}
            {DERIVED_KEYS.some(([k]) => sheet[k] !== undefined) && (
              <Section title="Derived Attributes">
                {DERIVED_KEYS.map(([k, label]) => (
                  <Row key={String(k)} label={label} value={sheet[k]} />
                ))}
              </Section>
            )}

            {/* Occupation */}
            {(sheet.occupation || sheet.occupationSkillPoints !== undefined) && (
              <Section title="Occupation">
                <Row label="Occupation"    value={sheet.occupation} />
                <Row label="Skill Points"  value={sheet.occupationSkillPoints} />
              </Section>
            )}

            {/* Skills */}
            {skills && Object.keys(skills).length > 0 && (
              <Section title="Skills">
                {Object.entries(skills).map(([name, val]) => (
                  <div key={name} className="flex justify-between text-xs py-0.5">
                    <span className="text-[var(--secondary-text-color)]">{name}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Backstory */}
            {BACKSTORY_KEYS.some(([k]) => sheet[k] !== undefined) && (
              <Section title="Backstory">
                {BACKSTORY_KEYS.map(([k, label]) => (
                  <Row key={String(k)} label={label} value={sheet[k]} />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
