import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuroraBackground } from './components/layout/AuroraBackground'
import { useGateway } from './hooks/useGateway'
import { useAppData } from './hooks/useAppData'

function AppInner() {
  useGateway()
  useAppData()
  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <AuroraBackground>
      <AppInner />
    </AuroraBackground>
  )
}
