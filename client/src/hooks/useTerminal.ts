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
  const [isTerminalReady, setIsTerminalReady] = useState(false)

  // Helper to safely fit the terminal
  const fitTerminal = useCallback(() => {
    if (!fitAddonRef.current || !terminalRef.current || !containerRef.current) return

    // Check if container is visible and has dimensions
    if (containerRef.current.clientWidth === 0 || containerRef.current.clientHeight === 0) return

    try {
      fitAddonRef.current.fit()
    } catch (e) {
      console.warn('Failed to fit terminal:', e)
    }
  }, [])

  const connect = useCallback((pId: string) => {
    if (!pId) return

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws?type=terminal`

    console.log('Connecting to WebSocket:', wsUrl)
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected, sending text')
      ws.send(JSON.stringify({ type: 'connect', profileId: pId }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'connected':
            console.log('Terminal session connected')
            setConnected(true)
            setError(null)
            // Initial fit after connection
            requestAnimationFrame(() => fitTerminal())
            break
          case 'output':
            terminalRef.current?.write(data.data)
            break
          case 'disconnected':
            console.log('Terminal session disconnected by server')
            setConnected(false)
            onDisconnect?.()
            break
          case 'error':
            console.error('Terminal server error:', data.message)
            setError(data.message)
            break
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason)
      setConnected(false)
      wsRef.current = null
    }

    ws.onerror = (event) => {
      console.error('WebSocket connection error:', event)
      setError('WebSocket connection error')
    }

    wsRef.current = ws
  }, [onDisconnect, fitTerminal])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      // Only send disconnect if open
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'disconnect' }))
        } catch (e) {
          console.warn('Failed to send disconnect message:', e)
        }
      }
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

  // Initialize xterm only when container has dimensions
  useEffect(() => {
    if (!containerRef.current) return

    const initTerminal = () => {
      if (terminalRef.current) return // Already initialized

      // Check dimensions again to be safe
      if (containerRef.current!.clientWidth === 0 || containerRef.current!.clientHeight === 0) return

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

      terminal.open(containerRef.current!)

      try {
        fitAddon.fit()
      } catch (e) {
        console.warn('Initial fit failed:', e)
      }

      terminalRef.current = terminal
      fitAddonRef.current = fitAddon

      terminal.onData((data) => {
        sendInput(data)
      })

      terminal.onResize((size) => {
        resize(size.cols, size.rows)
      })

      setIsTerminalReady(true)
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          if (!terminalRef.current) {
            initTerminal()
          } else {
            requestAnimationFrame(() => {
              fitTerminal()
              if (terminalRef.current) {
                resize(terminalRef.current.cols, terminalRef.current.rows)
              }
            })
          }
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    // Cleanup
    return () => {
      console.log('Cleaning up terminal')
      resizeObserver.disconnect()

      if (terminalRef.current) {
        terminalRef.current.dispose()
        terminalRef.current = null
        fitAddonRef.current = null
      }
      setIsTerminalReady(false)
      disconnect()
    }
  }, [sendInput, resize, disconnect, fitTerminal])

  // Connection effect - dependent on terminal being ready
  useEffect(() => {
    if (profileId && !connected && !wsRef.current && isTerminalReady) {
      connect(profileId)
    }
  }, [profileId, connected, connect, isTerminalReady])

  return {
    containerRef,
    connected,
    error,
    connect,
    disconnect,
    sendInput,
  }
}
