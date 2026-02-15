import { useRef, useEffect } from 'react'
import { useTerminal } from '../hooks/useTerminal'

interface TerminalPaneProps {
  sessionId: string | null
}

export default function TerminalPane({ sessionId }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { terminal } = useTerminal(containerRef)

  useEffect(() => {
    if (terminal && sessionId) {
      terminal.writeln(`Connected to session: ${sessionId}`)
      terminal.focus()
    }
  }, [terminal, sessionId])

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
