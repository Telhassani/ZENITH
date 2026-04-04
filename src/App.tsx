import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuroraBackground } from './components/layout/AuroraBackground';

export default function App() {
  return (
    <AuroraBackground>
      <RouterProvider router={router} />
    </AuroraBackground>
  );
}
