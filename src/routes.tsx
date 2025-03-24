
import { createBrowserRouter } from "react-router-dom";
import IndexPage from "./pages/Index";
import NotFoundPage from "./pages/NotFound";
import ApiSettings from "./pages/ApiSettings";
import ServerAutomation from "./pages/ServerAutomation";
import Bookmarklet from "./pages/Bookmarklet";
import ServerSettings from "./pages/ServerSettings";
import Records from "./pages/Records";
import GoogleSheetsIntegration from "./pages/GoogleSheetsIntegration";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <IndexPage />,
  },
  {
    path: "/api-settings",
    element: <ApiSettings />,
  },
  {
    path: "/server-automation",
    element: <ServerAutomation />,
  },
  {
    path: "/bookmarklet",
    element: <Bookmarklet />,
  },
  {
    path: "/server-settings",
    element: <ServerSettings />,
  },
  {
    path: "/records",
    element: <Records />,
  },
  {
    path: "/google-sheets",
    element: <GoogleSheetsIntegration />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
