import { Routes, Route } from 'react-router-dom'
import { AuroraBackground } from './components/layout/AuroraBackground'
import { Shell } from './components/layout/Shell'
import { MissionOverview } from './components/panels/MissionOverview'
import { AgentFleet } from './components/panels/AgentFleet'

export default function App() {
  return (
    <AuroraBackground>
      <Shell>
        <Routes>
          <Route path="/" element={<MissionOverview />} />
          <Route path="/agents" element={<AgentFleet />} />
        </Routes>
      </Shell>
    </AuroraBackground>
  )
}
