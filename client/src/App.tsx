import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Page Imports
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Owners from "@/pages/Owners";
import Properties from "@/pages/Properties";
import Tenants from "@/pages/Tenants";
import Leases from "@/pages/Leases";
import Payments from "@/pages/Payments";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/proprietarios" component={Owners} />
      <Route path="/imoveis" component={Properties} />
      <Route path="/inquilinos" component={Tenants} />
      <Route path="/contratos" component={Leases} />
      <Route path="/pagamentos" component={Payments} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
