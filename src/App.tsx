import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/theme-provider";
import { RecordingProvider } from "./contexts/RecordingContext";
import { SidebarProvider } from "./components/ui/sidebar";
import Index from "./pages/Index";
import Treatment1 from "./pages/Treatment1";
import Treatment2 from "./pages/Treatment2";
import Treatment3 from "./pages/Treatment3";
import Treatment4 from "./pages/Treatment4";
import Treatment5 from "./pages/Treatment5";
import FollowUp from "./pages/FollowUp";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RecordingProvider>
        <SidebarProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/treatment-1" element={<Treatment1 />} />
              <Route path="/treatment-2" element={<Treatment2 />} />
              <Route path="/treatment-3" element={<Treatment3 />} />
              <Route path="/treatment-4" element={<Treatment4 />} />
              <Route path="/treatment-5" element={<Treatment5 />} />
              <Route path="/follow-up" element={<FollowUp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </SidebarProvider>
      </RecordingProvider>
    </ThemeProvider>
  );
}

export default App;