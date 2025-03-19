
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Bookmarklet from './pages/Bookmarklet';
import ApiSettings from './pages/ApiSettings';
import Records from './pages/Records';
import ServerSettings from './pages/ServerSettings';
import CloudServer from './pages/CloudServer';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: 'bookmarklet',
        element: <Bookmarklet />,
      },
      {
        path: 'api-settings',
        element: <ApiSettings />,
      },
      {
        path: 'records',
        element: <Records />,
      },
      {
        path: 'server-settings',
        element: <ServerSettings />,
      },
      {
        path: 'cloud-server',
        element: <CloudServer />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
