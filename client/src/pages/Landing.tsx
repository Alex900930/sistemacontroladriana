import { Link } from "wouter";
import { Building2, ShieldCheck, Banknote, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="font-display font-bold text-2xl text-slate-900 tracking-tight">ImobiERP</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/api/login">
                <Button variant="ghost" className="font-medium text-slate-600 hover:text-blue-600">
                  Entrar
                </Button>
              </a>
              <a href="/api/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full px-6">
                  Começar Grátis
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <h1 className="text-5xl lg:text-6xl font-display font-bold text-slate-900 leading-[1.1]">
              Gestão imobiliária <span className="text-blue-600">simples</span> e eficiente.
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
              Automatize cobranças, gerencie contratos e acompanhe repasses em tempo real com integração bancária completa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/api/login">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/25">
                  Acessar Plataforma <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
          
          <div className="relative animate-in zoom-in duration-700 delay-200">
            {/* Abstract decorative elements */}
            <div className="absolute -top-12 -right-12 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
            
            {/* Hero Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-2">
              {/* Unsplash image: modern office building architecture */}
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070" 
                alt="Gestão Imobiliária" 
                className="rounded-xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold font-display text-slate-900">Tudo que você precisa</h2>
            <p className="mt-4 text-slate-600">Uma suíte completa de ferramentas para imobiliárias e administradores de imóveis.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Banknote,
                title: "Cobrança Automática",
                description: "Integração com Asaas para emissão de boletos e split de pagamentos automático."
              },
              {
                icon: ShieldCheck,
                title: "Segurança Total",
                description: "Seus dados e de seus clientes protegidos com criptografia de ponta a ponta."
              },
              {
                icon: Building2,
                title: "Gestão de Imóveis",
                description: "Controle total sobre vacância, contratos, vistorias e manutenções."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; 2024 ImobiERP. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
