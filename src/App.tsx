import { useState } from 'react'
import { generateCode } from './generateCode'

function App() {
  const [code, setCode] = useState<string | null>(null)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6">
      <button
        type="button"
        className="cursor-pointer rounded-lg bg-randomize px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-randomize-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => setCode(generateCode())}
      >
        Randomize
      </button>
      <p
        className={`m-0 font-mono text-xl tracking-wider text-white ${code ? 'visible' : 'invisible'}`}
      >
        {code ?? '\u00A0'}
      </p>
    </main>
  )
}

export default App
