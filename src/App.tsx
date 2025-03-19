import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Routes,
  BrowserRouter,
} from "react-router-dom";
import Index from "@/pages/Index";
import Bookmarklet from "@/pages/Bookmarklet";
import Records from "@/pages/Records";
import ApiSettings from "@/pages/ApiSettings";
import ServerSettings from "@/pages/ServerSettings";
import ServerAutomation from "@/pages/ServerAutomation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        {/* أضف مسار صفحة الأتمتة عبر الخادم هنا */}
        <Route path="/server-automation" element={<ServerAutomation />} />
        <Route path="/server-settings" element={<ServerSettings />} />
        <Route path="/bookmarklet" element={<Bookmarklet />} />
        <Route path="/records" element={<Records />} />
        <Route path="/api-settings" element={<ApiSettings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
