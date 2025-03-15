
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Records from "./pages/Records";
import ApiSettings from "./pages/ApiSettings";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import Bookmarklet from "./pages/Bookmarklet";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/records" element={<Records />} />
          <Route path="/api-settings" element={<ApiSettings />} />
          <Route path="/bookmarklet" element={<Bookmarklet />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}
