import { useState } from 'react'
import { generateCode, type Risk } from './generateCode'

function App() {
  const [risk, setRisk] = useState<Risk | null>(null)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6">
      <button
        type="button"
        className="cursor-pointer rounded-lg bg-randomize px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-randomize-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => setRisk(generateCode())}
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
