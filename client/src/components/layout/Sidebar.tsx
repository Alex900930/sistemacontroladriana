import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Key, 
  FileText, 
  DollarSign, 
  LogOut 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Imóveis", href: "/imoveis", icon: Building2 },
  { name: "Inquilinos", href: "/inquilinos", icon: Users },
  { name: "Proprietários", href: "/proprietarios", icon: Key },
  { name: "Contratos", href: "/contratos", icon: FileText },
  { name: "Pagamentos", href: "/pagamentos", icon: DollarSign },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900 text-white shadow-xl fixed left-0 top-0">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-blue-400">
          <Building2 className="h-6 w-6" />
          <span>ImobiERP</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <span className="font-bold text-blue-400 text-sm">
              {user?.firstName?.[0] || "U"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
