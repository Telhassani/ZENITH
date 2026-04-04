import { createBrowserRouter } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { MissionOverview } from './components/panels/MissionOverview';
import { AgentFleet } from './components/panels/AgentFleet';
import { TaskKanban } from './components/panels/TaskKanban';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell><MissionOverview /></Shell>,
  },
  {
    path: '/agents',
    element: <Shell><AgentFleet /></Shell>,
  },
  {
    path: '/tasks',
    element: <Shell><TaskKanban /></Shell>,
  },
]);
