import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import DealDetail from "@/pages/deal-detail";
import Bookings from "@/pages/bookings";
import Venues from "@/pages/venues";
import VenueDetail from "@/pages/venue-detail";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminVenues from "@/pages/admin-venues";
import AdminDeals from "@/pages/admin-deals";
import Navbar from "@/components/layout/Navbar";
import LoginModal from "@/components/LoginModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRouter() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <Navbar />
      <LoginModal />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/deals/:id" component={DealDetail} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/venues" component={Venues} />
          <Route path="/venues/:id" component={VenueDetail} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/venues" component={AdminVenues} />
          <Route path="/admin/deals" component={AdminDeals} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
