import { useState } from 'react'
import { generateCode, type Difficulty, type Risk } from './generateCode'

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
]

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [risk, setRisk] = useState<Risk | null>(null)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6">
      <div className="flex gap-2" role="group" aria-label="Difficulty">
        {DIFFICULTIES.map(({ key, label }) => {
          const selected = key === difficulty
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              className={[
                'cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                selected
                  ? 'bg-randomize text-white hover:bg-randomize-hover'
                  : 'bg-white/10 text-white/70 hover:bg-white/20',
              ].join(' ')}
              onClick={() => {
                setDifficulty(key)
                setRisk(null)
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="cursor-pointer rounded-lg bg-randomize px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-randomize-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => setRisk(generateCode(difficulty))}
      >
        Randomize
      </button>
      <div className={`flex flex-col items-center gap-2 ${risk ? 'visible' : 'invisible'}`}>
        <p className="m-0 font-mono text-xl tracking-wider text-white">
          {risk?.code ?? '\u00A0'}
        </p>
        <p className="m-0 text-sm text-white/70">
          {risk ? `Level ${risk.level}` : '\u00A0'}
        </p>
      </div>
    </main>
  )
}

export default App
