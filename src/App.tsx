
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Routes,
  BrowserRouter,
} from "react-router-dom";
import Index from "@/pages/Index";
import Records from "@/pages/Records";
import ServerSettings from "@/pages/ServerSettings";
import ServerAutomation from "@/pages/ServerAutomation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/server-automation" element={<ServerAutomation />} />
        <Route path="/server-settings" element={<ServerSettings />} />
        <Route path="/records" element={<Records />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
