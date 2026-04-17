import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import CoverLetters from "./pages/CoverLetters";
import CoverLetterEditor from "./pages/CoverLetterEditor";
import InterviewQuestions from "./pages/InterviewQuestions";
import Resumes from "./pages/Resumes";
import ResumeEditor from "./pages/ResumeEditor";
import Schedules from "./pages/Schedules";
import Checklist from "./pages/Checklist";
import Profile from "./pages/Profile";
import Scrapbook from "./pages/Scrapbook";
import AppLayout from "./components/AppLayout";

function Router() {
  return (
    <Switch>
      {/* 인증 페이지 */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={SignUp} />
      
      {/* 보호된 페이지 (AppLayout 사용) */}
      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      <Route path="/dashboard">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      <Route path="/scrapbook">
        <AppLayout>
          <Scrapbook />
        </AppLayout>
      </Route>
      <Route path="/cover-letters">
        <AppLayout>
          <CoverLetterEditor />
        </AppLayout>
      </Route>
      <Route path="/my-cover-letters">
        <AppLayout>
          <CoverLetters />
        </AppLayout>
      </Route>
      <Route path="/interview">
        <AppLayout>
          <InterviewQuestions />
        </AppLayout>
      </Route>
      <Route path="/resumes">
        <AppLayout>
          <Resumes />
        </AppLayout>
      </Route>
      <Route path="/resumes/new">
        <AppLayout>
          <ResumeEditor />
        </AppLayout>
      </Route>
      <Route path="/resumes/:id">
        {(params) => (
          <AppLayout>
            <ResumeEditor id={Number(params.id)} />
          </AppLayout>
        )}
      </Route>
      <Route path="/schedules">
        <AppLayout>
          <Schedules />
        </AppLayout>
      </Route>
      <Route path="/checklist">
        <AppLayout>
          <Checklist />
        </AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout>
          <Profile />
        </AppLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
