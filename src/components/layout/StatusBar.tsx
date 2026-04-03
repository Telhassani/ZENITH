import { useGatewayStore } from '../../stores/gatewayStore'

export function StatusBar() {
  const { connected } = useGatewayStore()

  return (
    <footer className="h-9 glass-panel mx-4 mb-4 flex items-center px-4 gap-4 text-xs font-mono text-slate-400">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        <span>OpenClaw: {connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <span className="text-slate-600">|</span>
      <span>PKOS: Checking...</span>
      <span className="text-slate-600">|</span>
      <span>Telegram: Not configured</span>
      <span className="text-slate-600">|</span>
      <span className="ml-auto">Queue: -</span>
    </footer>
  )
}
