import { forwardRef, useImperativeHandle } from 'react'
import { useTerminal } from '../hooks/useTerminal'

interface TerminalProps {
  profileId: string | null
  onDisconnect?: () => void
}

export interface TerminalHandle {
  sendInput: (data: string) => void
}

const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal({ profileId, onDisconnect }, ref) {
  const { containerRef, connected, error, sendInput } = useTerminal({
    profileId,
    onDisconnect,
  })

  useImperativeHandle(ref, () => ({
    sendInput,
  }), [sendInput])

  return (
    <div className="h-full w-full relative">
      {!connected && !error && profileId && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-gray-400">连接中...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-red-400">错误: {error}</div>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
})

export default Terminal
