
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Residents } from './components/Residents';
import { Inventory } from './components/Inventory';
import { Medications } from './components/Medications';
import { StockOperations } from './components/StockOperations';
import { Reports } from './components/Reports';
import { MedicalCare } from './components/MedicalCare';
import { TechnicalCare } from './components/TechnicalCare'; 
import { Demands } from './components/Demands';
import { PersonalItems } from './components/PersonalItems';
import { Employees } from './components/Employees';
import { Evolutions } from './components/Evolutions';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { AppData, Product, Resident, Transaction, ViewName, Prescription, MedicalAppointment, Demand, Professional, Employee, TimeSheetEntry, TechnicalSession, EvolutionRecord, HouseDocument } from './types';
import { loadData, saveData, saveRemoteData, subscribeToUserData, exportData } from './services/storage';
import { Database, Upload, Download, RefreshCw, Trash2, HeartHandshake, CloudOff, Cloud } from 'lucide-react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { INITIAL_DATA } from './constants';

// Helper for Safe ID Generation
const generateSafeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<ViewName>('dashboard');
  
  // Data State
  const [data, setData] = useState<AppData>(INITIAL_DATA as AppData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Ref to unsubscribe from Firestore listener
  const unsubscribeRef = useRef<() => void>();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      // Se deslogar, limpa listener e volta para dados locais (ou limpa)
      if (!currentUser) {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = undefined;
        }
        // Carrega dados locais (fallback/offline mode se desejado)
        const localData = loadData();
        setData(localData);
        setIsDataLoaded(true);
        setIsOfflineMode(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  // Effect to subscribe to Firestore when user logs in
  useEffect(() => {
    if (user) {
      setIsDataLoaded(false);
      setIsOfflineMode(false);
      console.log("Conectando ao banco de dados remoto...");
      
      unsubscribeRef.current = subscribeToUserData(
        user.uid, 
        (remoteData) => {
          setData(remoteData);
          setIsDataLoaded(true);
          setIsOfflineMode(false);
        },
        (error) => {
          // Erro de permissão ou rede: Fallback para local
          console.warn("Falha na conexão remota. Usando dados locais.", error);
          const localData = loadData();
          setData(localData);
          setIsDataLoaded(true);
          setIsOfflineMode(true);
        }
      );
    }
  }, [user]);

  // Effect to Save Data (Debounced or Immediate)
  // Como as atualizações locais são instantâneas na UI, salvamos no Firestore quando 'data' muda.
  useEffect(() => {
    if (!isDataLoaded) return; // Não salva se ainda estiver carregando a primeira vez

    // Salva localmente sempre como backup
    saveData(data);

    if (user && !isOfflineMode) {
      setIsSaving(true);
      // Pequeno debounce para evitar writes excessivos em digitação rápida
      const timeoutId = setTimeout(() => {
        saveRemoteData(user.uid, data)
          .then(() => setIsSaving(false))
          .catch((err) => {
            console.error("Erro ao salvar nuvem:", err);
            setIsSaving(false);
            // Se falhar ao salvar, talvez devêssemos avisar ou mudar para offline, 
            // mas erros de escrita temporários são comuns.
          });
      }, 1000); // 1 segundo de debounce

      return () => clearTimeout(timeoutId);
    }
  }, [data, user, isDataLoaded, isOfflineMode]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // --- Handlers (CRUD) ---
  // Todos os handlers atualizam o estado local 'data'. 
  // O useEffect acima detecta a mudança e sincroniza com o Firestore.

  const handleSaveResident = (resident: Resident) => {
    setData(prev => {
      const residents = [...(prev.residents || [])];
      const index = residents.findIndex(r => r.id === resident.id);
      
      if (index >= 0) {
        residents[index] = resident;
      } else {
        residents.push({ ...resident, id: resident.id || generateSafeId() });
      }
      return { ...prev, residents };
    });
  };

  const handleDeleteResident = (id: string) => {
    setData(prev => ({ ...prev, residents: (prev.residents || []).filter(r => r.id !== id) }));
  };

  const handleSaveProduct = (product: Product) => {
    setData(prev => {
      const products = [...(prev.products || [])];
      const index = products.findIndex(p => p.id === product.id);
      
      if (index >= 0) {
        products[index] = product;
      } else {
        products.push({ ...product, id: product.id || generateSafeId() });
      }
      return { ...prev, products };
    });
  };

  const handleDeleteProduct = (id: string) => {
    setData(prev => ({ ...prev, products: (prev.products || []).filter(p => p.id !== id) }));
  };

  const handleTransaction = (transaction: Transaction) => {
    setData(prev => {
      const products = [...(prev.products || [])];
      const transactions = [...(prev.transactions || [])];

      const productIndex = products.findIndex(p => p.id === transaction.productId);
      if (productIndex >= 0) {
        const product = { ...products[productIndex] };
        const change = transaction.type === 'IN' ? transaction.quantity : -transaction.quantity;
        product.currentStock = product.currentStock + change;
        products[productIndex] = product;
      }

      transactions.push({ ...transaction, id: transaction.id || generateSafeId() });

      return {
        ...prev,
        products,
        transactions
      };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setData(prev => {
      const transactions = [...(prev.transactions || [])];
      const products = [...(prev.products || [])];

      const txIndex = transactions.findIndex(t => t.id === id);
      
      if (txIndex === -1) return prev;
      const txToRemove = transactions[txIndex];

      const productIndex = products.findIndex(p => p.id === txToRemove.productId);
      
      if (productIndex >= 0) {
        const product = { ...products[productIndex] };
        const change = txToRemove.type === 'IN' ? -txToRemove.quantity : txToRemove.quantity;
        product.currentStock = product.currentStock + change;
        products[productIndex] = product;
      }

      const newTransactions = transactions.filter(t => t.id !== id);

      return { ...prev, products, transactions: newTransactions };
    });
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setData(prev => {
      const transactions = [...(prev.transactions || [])];
      const txIndex = transactions.findIndex(t => t.id === updatedTx.id);
      
      if (txIndex === -1) return prev;
      const oldTx = transactions[txIndex];

      const qtyDifference = updatedTx.quantity - oldTx.quantity;

      const products = [...(prev.products || [])];
      const productIndex = products.findIndex(p => p.id === updatedTx.productId);

      if (productIndex >= 0) {
        const product = { ...products[productIndex] };
        const stockAdjustment = updatedTx.type === 'IN' ? qtyDifference : -qtyDifference;
        product.currentStock = product.currentStock + stockAdjustment;
        products[productIndex] = product;
      }

      transactions[txIndex] = updatedTx;

      return { ...prev, products, transactions };
    });
  };

  const handleSavePrescription = (prescription: Prescription) => {
    setData(prev => {
      const prescriptions = [...(prev.prescriptions || [])];
      const index = prescriptions.findIndex(p => p.id === prescription.id);
      
      if (index >= 0) {
        prescriptions[index] = prescription;
      } else {
        prescriptions.push({ ...prescription, id: prescription.id || generateSafeId() });
      }
      return { ...prev, prescriptions };
    });
  };

  const handleDeletePrescription = (id: string) => {
    setData(prev => ({ ...prev, prescriptions: (prev.prescriptions || []).filter(p => p.id !== id) }));
  };

  const handleSaveAppointment = (appointment: MedicalAppointment) => {
    setData(prev => {
      const appointments = [...(prev.medicalAppointments || [])];
      const index = appointments.findIndex(a => a.id === appointment.id);
      
      if (index >= 0) {
        appointments[index] = appointment;
      } else {
        appointments.push({ ...appointment, id: appointment.id || generateSafeId() });
      }
      return { ...prev, medicalAppointments: appointments };
    });
  };

  const handleDeleteAppointment = (id: string) => {
    setData(prev => ({ ...prev, medicalAppointments: (prev.medicalAppointments || []).filter(a => a.id !== id) }));
  };

  const handleSaveDemand = (demand: Demand) => {
    setData(prev => {
      const demands = [...(prev.demands || [])];
      const index = demands.findIndex(d => d.id === demand.id);
      
      if (index >= 0) {
        demands[index] = demand;
      } else {
        demands.push({ ...demand, id: demand.id || generateSafeId() });
      }
      return { ...prev, demands };
    });
  };

  const handleDeleteDemand = (id: string) => {
    setData(prev => ({ ...prev, demands: (prev.demands || []).filter(d => d.id !== id) }));
  };

  const handleSaveProfessional = (professional: Professional) => {
    setData(prev => {
      const professionals = [...(prev.professionals || [])];
      const index = professionals.findIndex(p => p.id === professional.id);
      
      if (index >= 0) {
        professionals[index] = professional;
      } else {
        professionals.push({ ...professional, id: professional.id || generateSafeId() });
      }
      return { ...prev, professionals };
    });
  };

  const handleDeleteProfessional = (id: string) => {
    setData(prev => ({ ...prev, professionals: (prev.professionals || []).filter(p => p.id !== id) }));
  };

  const handleSaveEmployee = (employee: Employee) => {
    setData(prev => {
      const employees = [...(prev.employees || [])];
      const index = employees.findIndex(e => e.id === employee.id);
      if (index >= 0) {
        employees[index] = employee;
      } else {
        employees.push({ ...employee, id: employee.id || generateSafeId() });
      }
      return { ...prev, employees };
    });
  };

  const handleDeleteEmployee = (id: string) => {
    setData(prev => ({ ...prev, employees: (prev.employees || []).filter(e => e.id !== id) }));
  };

  const handleSaveRoles = (roles: string[]) => {
    setData(prev => ({ ...prev, employeeRoles: roles }));
  };

  const handleSaveTimeSheet = (entry: TimeSheetEntry) => {
    setData(prev => {
      const timeSheets = [...(prev.timeSheets || [])];
      const exists = timeSheets.findIndex(ts => ts.date === entry.date && ts.employeeId === entry.employeeId);
      if (exists === -1) {
        timeSheets.push(entry);
      }
      return { ...prev, timeSheets };
    });
  };

  const handleDeleteTimeSheet = (date: string, employeeId: string) => {
    setData(prev => ({
      ...prev,
      timeSheets: (prev.timeSheets || []).filter(ts => !(ts.date === date && ts.employeeId === employeeId))
    }));
  };

  const handleSaveTechnicalSession = (session: TechnicalSession) => {
    setData(prev => {
      const sessions = [...(prev.technicalSessions || [])];
      const index = sessions.findIndex(s => s.id === session.id);
      if (index >= 0) {
        sessions[index] = session;
      } else {
        sessions.push({ ...session, id: session.id || generateSafeId() });
      }
      return { ...prev, technicalSessions: sessions };
    });
  };

  const handleDeleteTechnicalSession = (id: string) => {
    setData(prev => ({ ...prev, technicalSessions: (prev.technicalSessions || []).filter(s => s.id !== id) }));
  };

  const handleSaveEvolution = (records: EvolutionRecord[]) => {
    setData(prev => {
      const newEvolutions = [...(prev.evolutions || [])];
      records.forEach(record => {
         const idx = newEvolutions.findIndex(e => 
           e.residentId === record.residentId && 
           e.role === record.role && 
           (record.type === 'DIARIA' ? e.date === record.date : e.date.substring(0,7) === record.date.substring(0,7))
         );
         
         if (idx >= 0) {
            newEvolutions[idx] = record;
         } else {
            newEvolutions.push(record);
         }
      });
      return { ...prev, evolutions: newEvolutions };
    });
  };

  const handleDeleteEvolution = (id: string) => {
    setData(prev => ({ ...prev, evolutions: (prev.evolutions || []).filter(e => e.id !== id) }));
  };

  const handleSaveHouseDocument = (doc: HouseDocument) => {
    setData(prev => {
      const houseDocuments = [...(prev.houseDocuments || [])];
      const index = houseDocuments.findIndex(d => d.id === doc.id);
      if (index >= 0) {
        houseDocuments[index] = doc;
      } else {
        houseDocuments.push({ ...doc, id: doc.id || generateSafeId() });
      }
      return { ...prev, houseDocuments };
    });
  };

  const handleDeleteHouseDocument = (id: string) => {
    setData(prev => ({ ...prev, houseDocuments: (prev.houseDocuments || []).filter(d => d.id !== id) }));
  };

  // --- Import/Export/Reset ---

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const json = JSON.parse(jsonContent);

        if (Array.isArray(json.residents) && Array.isArray(json.products)) {
          if(window.confirm("ATENÇÃO: Restaurar este backup substituirá COMPLETAMENTE os dados atuais.\n\nEssa ação não pode ser desfeita. Deseja continuar?")) {
             // Atualiza estado (o useEffect salvará no Firestore automaticamente)
             setData(json);
             alert("Backup restaurado com sucesso!");
          }
        } else {
          alert("Arquivo inválido. A estrutura do arquivo não corresponde a um backup do LifeCare.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao ler o arquivo. Verifique se é um JSON válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFactoryReset = () => {
    const confirmText = prompt("PERIGO: Isso apagará TODOS os dados cadastrados (residentes, estoque, histórico) e restaurará o estado inicial do aplicativo.\n\nDigite 'RESETAR' para confirmar:");
    if (confirmText === 'RESETAR') {
      localStorage.removeItem('careflow_db_v1');
      localStorage.removeItem('careflow_db_snapshot');
      
      // Reseta estado (o useEffect salvará no Firestore)
      setData(INITIAL_DATA as AppData);
      
      alert("Sistema restaurado para o padrão de fábrica.");
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard data={data} onNavigate={setView} />;
      case 'evolutions':
        return (
          <Evolutions
            data={data}
            onSaveEvolution={handleSaveEvolution}
            onDeleteEvolution={handleDeleteEvolution}
          />
        );
      case 'residents':
        return (
          <Residents 
            data={data} 
            onSave={handleSaveResident} 
            onDelete={handleDeleteResident}
            onDeleteTransaction={handleDeleteTransaction} 
            onUpdateTransaction={handleUpdateTransaction} 
            onSaveDemand={handleSaveDemand}
          />
        );
      case 'employees':
        return (
          <Employees 
            data={data}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onSaveRoles={handleSaveRoles}
            onSaveTimeSheet={handleSaveTimeSheet}
            onDeleteTimeSheet={handleDeleteTimeSheet}
          />
        );
      case 'admin-panel':
        return (
          <AdminPanel
            data={data}
            onUpdateEmployee={handleSaveEmployee}
            onUpdateProfessional={handleSaveProfessional}
            onSaveHouseDocument={handleSaveHouseDocument}
            onDeleteHouseDocument={handleDeleteHouseDocument}
            onSaveDemand={handleSaveDemand} 
            onUpdateResident={handleSaveResident}
          />
        );
      case 'medications':
        return (
          <Medications 
            data={data} 
            onSave={handleSaveProduct} 
            onDelete={handleDeleteProduct} 
            onTransaction={handleTransaction}
            onSavePrescription={handleSavePrescription}
            onDeletePrescription={handleDeletePrescription}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction} 
          />
        );
      case 'medical-care':
        return (
          <MedicalCare 
            data={data}
            onSave={handleSaveAppointment}
            onDelete={handleDeleteAppointment}
          />
        );
      case 'technical-care':
        return (
          <TechnicalCare 
            data={data}
            onSaveSession={handleSaveTechnicalSession}
            onDeleteSession={handleDeleteTechnicalSession}
          />
        );
      case 'demands':
        return (
          <Demands
            data={data}
            onSave={handleSaveDemand}
            onDelete={handleDeleteDemand}
            onSaveProfessional={handleSaveProfessional}
            onDeleteProfessional={handleDeleteProfessional}
          />
        );
      case 'inventory':
        return <Inventory data={data} onSave={handleSaveProduct} onDelete={handleDeleteProduct} />;
      case 'operations':
        return (
          <StockOperations 
             data={data} 
             onTransaction={handleTransaction}
             onDeleteTransaction={handleDeleteTransaction}
             onUpdateTransaction={handleUpdateTransaction}
          />
        );
      case 'personal-items':
        return (
          <PersonalItems
             data={data}
             onTransaction={handleTransaction}
          />
        );
      case 'reports':
        return <Reports data={data} onTransaction={handleTransaction} />;
      case 'settings':
        return (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <Database /> Configurações de Dados
            </h2>
            <div className="space-y-6">
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2">Backup Manual (Cópia Extra)</h3>
                <p className="text-sm text-blue-600 mb-4">Baixe uma cópia adicional dos dados para enviar por e-mail ou guardar em outro local.</p>
                <button 
                  onClick={() => exportData(data)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full justify-center md:w-auto font-bold"
                >
                  <Download size={18} /> Baixar Cópia Extra
                </button>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <h3 className="font-bold text-amber-800 mb-2">Restaurar de Arquivo Externo</h3>
                <p className="text-sm text-amber-600 mb-4">Importe um arquivo de backup antigo (substituirá os dados atuais).</p>
                <label className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 w-full justify-center md:w-auto cursor-pointer shadow-sm font-bold">
                  <Upload size={18} /> 
                  Selecionar Arquivo
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-100 mt-8">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><Trash2 size={18}/> Zona de Perigo</h3>
                <p className="text-sm text-red-600 mb-4">Caso o sistema apresente erros graves, você pode resetar tudo.</p>
                <button 
                  onClick={handleFactoryReset}
                  className="flex items-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 w-full justify-center md:w-auto text-sm font-bold"
                >
                  <RefreshCw size={16} /> Resetar para Padrão de Fábrica
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Página não encontrada</div>;
    }
  };

  // --- Render Lifecycle States ---

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-primary-600">
        <HeartHandshake size={64} className="mb-4 animate-pulse" />
        <p className="font-medium text-lg">Iniciando sistema LifeCare...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <RefreshCw size={48} className="mb-4 animate-spin text-primary-500" />
        <p className="font-medium text-lg">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <Layout currentView={view} onNavigate={setView} onLogout={handleLogout}>
      {/* Cloud Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        {isOfflineMode ? (
          <div className="bg-amber-100 border border-amber-300 shadow-lg rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-amber-700 animate-pulse">
            <CloudOff size={12} /> Modo Offline (Local)
          </div>
        ) : isSaving ? (
          <div className="bg-white border border-slate-200 shadow-lg rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-500 animate-pulse">
            <RefreshCw size={12} className="animate-spin"/> Salvando...
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-md rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-green-600 opacity-80 hover:opacity-100 transition-opacity" title="Dados sincronizados">
            <Cloud size={12} /> Salvo
          </div>
        )}
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
