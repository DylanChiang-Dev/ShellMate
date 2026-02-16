import { forwardRef, useImperativeHandle, useState, useEffect } from 'react'
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

  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (error) {
      setShowError(true)
    }
  }, [error])

  useImperativeHandle(ref, () => ({
    sendInput,
  }), [sendInput])

  return (
    <div className="h-full w-full relative">
      {showError && error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/95">
          <div className="max-w-md p-6 bg-red-900/50 border border-red-500 rounded-lg">
            <div className="text-red-400 font-bold mb-2">连接失败</div>
            <div className="text-red-300 text-sm">{error}</div>
            <button
              onClick={() => setShowError(false)}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              关闭
            </button>
          </div>
        </div>
      )}
      {!connected && !error && profileId && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-gray-400">连接中...</div>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
})

export default Terminal
