import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// Updated to use the mock user object directly
const mockUser = { id: 1, username: 'admin' };

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Commented out the authentication guard to allow unrestricted access
  // if (!isAuthenticated) {
  //   setLocation("/");
  //   return null;
  // }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={mockUser} />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
        <footer className="text-center text-sm text-gray-500 mt-8">
          Desarrollado por Alex Herrera 2026
        </footer>
      </main>
    </div>
  );
}
