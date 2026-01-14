import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Package, ArrowRightLeft, 
  BarChart3, Settings, Menu, X, Pill, HeartHandshake, 
  Stethoscope, ClipboardList, ShoppingBag, Briefcase, 
  HeartPulse, FileText, Shield, LogOut
} from 'lucide-react';
import { ViewName } from '../types';

interface LayoutProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, onLogout, children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // 768px is the standard 'md' breakpoint in Tailwind
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems: { id: ViewName; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: <LayoutDashboard size={20} /> },
    { id: 'evolutions', label: 'Evoluções', icon: <FileText size={20} /> },
    { id: 'residents', label: 'Residentes', icon: <Users size={20} /> },
    { id: 'employees', label: 'Equipe', icon: <Briefcase size={20} /> },
    { id: 'demands', label: 'Demandas', icon: <ClipboardList size={20} /> },
    { id: 'admin-panel', label: 'Painel Adm', icon: <Shield size={20} /> },
    { id: 'medications', label: 'Medicamentos', icon: <Pill size={20} /> },
    { id: 'medical-care', label: 'Atend. Médico', icon: <Stethoscope size={20} /> },
    { id: 'technical-care', label: 'Atend. Técnico', icon: <HeartPulse size={20} /> },
    { id: 'inventory', label: 'Estoque Geral', icon: <Package size={20} /> },
    { id: 'operations', label: 'Movimentações', icon: <ArrowRightLeft size={20} /> },
    { id: 'personal-items', label: 'Itens Pessoais', icon: <ShoppingBag size={20} /> },
    { id: 'reports', label: 'Relatórios', icon: <BarChart3 size={20} /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={20} /> },
  ];

  const handleNav = (view: ViewName) => {
    onNavigate(view);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Mobile Overlay - Only visible on mobile when sidebar is open */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-slate-200 flex flex-col
          transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 h-20">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg text-white">
               <HeartHandshake size={24} />
            </div>
            <div>
               <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">LifeCare</h1>
               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Gestão Residencial</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm
                ${currentView === item.id 
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm text-red-600 hover:bg-red-50"
           >
             <LogOut size={20} />
             <span>Sair do Sistema</span>
           </button>
           <div className="mt-4 text-[10px] text-slate-400 text-center uppercase tracking-wider font-bold">
              LifeCare v1.3 • Sistema Integrado
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 relative">
        {/* Mobile Header - Visible only on mobile */}
        <header className="md:hidden bg-white text-slate-800 p-4 flex justify-between items-center shadow-sm z-30 h-16 shrink-0 border-b border-slate-200">
          <div className="flex items-center gap-2">
             <div className="bg-primary-600 p-1.5 rounded text-white">
                <HeartHandshake size={20} />
             </div>
             <h1 className="text-lg font-bold text-slate-800">LifeCare</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};