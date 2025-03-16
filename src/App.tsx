
import { BrowserRouter as Router } from "react-router-dom";
import { AppRoutes } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}
