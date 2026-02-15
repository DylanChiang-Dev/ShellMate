import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface UseTerminalOptions {
  profileId: string | null
  onDisconnect?: () => void
}

export function useTerminal({ profileId, onDisconnect }: UseTerminalOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback((pId: string) => {
    if (!pId) return

    if (wsRef.current) {
      wsRef.current.close()
    }

    const wsUrl = `/ws?type=terminal`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', profileId: pId }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'connected':
          setConnected(true)
          setError(null)
          break
        case 'output':
          terminalRef.current?.write(data.data)
          break
        case 'disconnected':
          setConnected(false)
          onDisconnect?.()
          break
        case 'error':
          setError(data.message)
          break
      }
    }

    ws.onclose = () => {
      setConnected(false)
    }

    ws.onerror = () => {
      setError('WebSocket connection error')
    }

    wsRef.current = ws
  }, [onDisconnect])

  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'disconnect' }))
      wsRef.current.close()
      wsRef.current = null
    } else if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  const sendInput = useCallback((data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data }))
    }
  }, [])

  const resize = useCallback((cols: number, rows: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new XTerm({
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
      },
      cursorBlink: true,
      allowTransparency: true,
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminal.open(containerRef.current)
    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    terminal.onData((data) => {
      sendInput(data)
    })

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      resize(terminal.cols, terminal.rows)
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      terminal.dispose()
      disconnect()
    }
  }, [sendInput, resize, disconnect])

  useEffect(() => {
    if (profileId && connected === false) {
      connect(profileId)
    }
  }, [profileId, connect, connected])

  return {
    containerRef,
    connected,
    error,
    connect,
    disconnect,
  }
}
