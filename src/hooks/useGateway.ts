import { useEffect, useRef } from 'react'
import { useGatewayStore } from '../stores/gatewayStore'

export function useGateway() {
  const wsRef = useRef<WebSocket | null>(null)
  const { setConnected, setGatewayUrl } = useGatewayStore()

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Connected to backend WS relay')
      setConnected(true)
      setGatewayUrl(wsUrl)
    }

    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data)
        console.log('WS event:', frame.event)
      } catch (err) {
        console.error('WS message parse error:', err)
      }
    }

    ws.onclose = () => {
      console.log('Backend WS disconnected')
      setConnected(false)
    }

    ws.onerror = (err) => {
      console.error('WS error:', err)
    }

    return () => {
      ws.close()
    }
  }, [setConnected, setGatewayUrl])

  return { ws: wsRef.current }
}
