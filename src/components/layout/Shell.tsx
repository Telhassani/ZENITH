import { ChromeBar } from './ChromeBar'
import { SideRail } from './SideRail'
import { StatusBar } from './StatusBar'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <ChromeBar />
      <div className="flex flex-1 overflow-hidden">
        <SideRail />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
      <StatusBar />
    </div>
  )
}
