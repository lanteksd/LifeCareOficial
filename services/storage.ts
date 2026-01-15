
import { AppData, Product, Resident, Transaction, Prescription, MedicalAppointment, Demand, Professional, Employee, TimeSheetEntry, TechnicalSession, EvolutionRecord, ResidentDocument, Pharmacy, StaffDocument, HouseDocument, FinancialRecord } from "../types";
import { INITIAL_DATA as CONST_INITIAL_DATA, INITIAL_EMPLOYEE_ROLES } from "../constants";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// Extendendo INITIAL_DATA do constants para incluir o novo campo vazio
const INITIAL_DATA_EXTENDED = {
  ...CONST_INITIAL_DATA,
  houseDocuments: []
};

// --- SAFE ID GENERATOR (Critical for Data Persistence) ---
const generateSafeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback silencioso
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- MIGRATION HELPERS (DEFENSIVE CODING) ---

const migrateDocument = (d: any): ResidentDocument => ({
  id: d.id || generateSafeId(),
  type: d.type || 'OUTRO',
  name: d.name || 'Documento',
  date: d.date || new Date().toISOString().split('T')[0],
  base64: d.base64 || '', // Legado
  linkUrl: d.linkUrl || '', // Novo
  issueDate: d.issueDate || '' // Novo: Data de emissão para cálculo de validade
});

const migrateStaffDocument = (d: any): StaffDocument => ({
  id: d.id || generateSafeId(),
  type: d.type || 'OUTRO',
  name: d.name || 'Documento',
  linkUrl: d.linkUrl || '',
  date: d.date || new Date().toISOString().split('T')[0]
});

// Novo helper para HouseDocument
const migrateHouseDocument = (d: any): HouseDocument => ({
  id: d.id || generateSafeId(),
  type: d.type || 'OUTRO',
  name: d.name || 'Documento da Casa',
  linkUrl: d.linkUrl || '',
  expirationDate: d.expirationDate || '',
  issueDate: d.issueDate || ''
});

const migrateFinancialRecord = (f: any): FinancialRecord => ({
  id: f.id || generateSafeId(),
  monthKey: f.monthKey || new Date().toISOString().slice(0, 7),
  value: typeof f.value === 'number' ? f.value : 0,
  dueDate: f.dueDate || '',
  status: f.status || 'PENDENTE',
  paymentDate: f.paymentDate || '',
  notes: f.notes || ''
});

const migratePharmacy = (p: any): Pharmacy => ({
  id: p.id || generateSafeId(),
  name: p.name || 'Farmácia',
  phone: p.phone || ''
});

const migrateResident = (r: any): Resident => ({
  id: r.id || generateSafeId(),
  name: r.name || 'Nome Desconhecido',
  cpf: r.cpf || '',
  birthDate: r.birthDate || '',
  admissionDate: r.admissionDate || '',
  room: r.room || 'A definir',
  photo: r.photo || '',
  dailyExchangeEstimate: typeof r.dailyExchangeEstimate === 'number' ? r.dailyExchangeEstimate : 5,
  absorbentDailyExchangeEstimate: typeof r.absorbentDailyExchangeEstimate === 'number' ? r.absorbentDailyExchangeEstimate : 0,
  observations: r.observations || '',
  active: r.active !== undefined ? r.active : true,
  pharmacyPhone: r.pharmacyPhone || '', 
  pharmacies: Array.isArray(r.pharmacies) ? r.pharmacies.map(migratePharmacy) : [],
  responsible: {
    name: r.responsible?.name || '',
    relation: r.responsible?.relation || '',
    phone1: r.responsible?.phone1 || '',
    phone2: r.responsible?.phone2 || '',
    email: r.responsible?.email || ''
  },
  documents: Array.isArray(r.documents) ? r.documents.map(migrateDocument) : [],
  // Novos campos financeiros
  defaultMonthlyFee: typeof r.defaultMonthlyFee === 'number' ? r.defaultMonthlyFee : 0,
  defaultDueDay: typeof r.defaultDueDay === 'number' ? r.defaultDueDay : 10,
  financialRecords: Array.isArray(r.financialRecords) ? r.financialRecords.map(migrateFinancialRecord) : []
});

const migrateProduct = (p: any): Product => ({
  id: p.id || generateSafeId(),
  name: p.name || 'Produto Sem Nome',
  brand: p.brand || '',
  category: p.category || 'Outros',
  currentStock: typeof p.currentStock === 'number' ? p.currentStock : 0,
  minStock: typeof p.minStock === 'number' ? p.minStock : 5,
  unit: p.unit || 'Unidade'
});

const migratePrescription = (p: any): Prescription => ({
  id: p.id || generateSafeId(),
  residentId: p.residentId || '',
  productId: p.productId || '',
  productName: p.productName || 'Medicamento',
  dosage: p.dosage || '',
  frequency: p.frequency || '',
  times: p.times || '',
  pdfBase64: p.pdfBase64 || '',
  linkUrl: p.linkUrl || '', // Novo campo
  active: p.active !== undefined ? p.active : true,
  isTreatment: p.isTreatment !== undefined ? p.isTreatment : false // Novo campo: Tratamento/Temporário
});

const migrateTransaction = (t: any): Transaction => ({
  id: t.id || generateSafeId(),
  date: t.date || new Date().toISOString().split('T')[0],
  type: t.type || 'OUT',
  productId: t.productId || '',
  productName: t.productName || 'Item Removido',
  residentId: t.residentId || '',
  residentName: t.residentName || '',
  quantity: typeof t.quantity === 'number' ? t.quantity : 1,
  notes: t.notes || ''
});

const migrateAppointment = (a: any): MedicalAppointment => ({
  id: a.id || generateSafeId(),
  residentId: a.residentId || '',
  type: a.type || 'CONSULTA',
  specialty: a.specialty || 'Clínico Geral',
  doctorName: a.doctorName || '',
  date: a.date || '',
  time: a.time || '',
  location: a.location || '',
  status: a.status || 'AGENDADO',
  notes: a.notes || '',
  diagnosis: a.diagnosis || '',
  accompanyingPerson: a.accompanyingPerson || '',
  outcomeNotes: a.outcomeNotes || '',
  attachmentBase64: a.attachmentBase64 || '',
  linkUrl: a.linkUrl || '' // Novo campo
});

const migrateDemand = (d: any): Demand => ({
    id: d.id || generateSafeId(),
    professionalAreas: d.professionalAreas || (d.professionalArea ? [d.professionalArea] : []),
    title: d.title || 'Demanda sem título',
    description: d.description || '',
    residentIds: Array.isArray(d.residentIds) ? d.residentIds : [],
    status: d.status || 'PENDENTE',
    creationDate: d.creationDate || new Date().toISOString().split('T')[0],
    dueDate: d.dueDate || ''
});

const migrateProfessional = (prof: any): Professional => ({
    id: prof.id || generateSafeId(),
    name: prof.name || 'Profissional Sem Nome',
    area: prof.area || 'ENFERMAGEM',
    phone: prof.phone || '',
    photo: prof.photo || '',
    documents: Array.isArray(prof.documents) ? prof.documents.map(migrateStaffDocument) : []
});

const migrateEmployee = (emp: any): Employee => ({
  id: emp.id || generateSafeId(),
  name: emp.name || 'Funcionário',
  role: emp.role || 'CUIDADOR(A)',
  phone: emp.phone || '',
  cpf: emp.cpf || '',
  admissionDate: emp.admissionDate || '',
  active: emp.active !== undefined ? emp.active : true,
  photo: emp.photo || '',
  documents: Array.isArray(emp.documents) ? emp.documents.map(migrateStaffDocument) : []
});

const migrateTimeSheet = (ts: any): TimeSheetEntry => ({
  id: ts.id || generateSafeId(),
  date: ts.date || new Date().toISOString().split('T')[0],
  employeeId: ts.employeeId || '',
  present: ts.present !== undefined ? ts.present : false,
  notes: ts.notes || ''
});

const migrateTechnicalSession = (ts: any): TechnicalSession => ({
  id: ts.id || generateSafeId(),
  residentId: ts.residentId || '',
  professionalId: ts.professionalId || '',
  professionalName: ts.professionalName || '',
  area: ts.area || 'PSICOLOGIA',
  date: ts.date || new Date().toISOString().split('T')[0],
  status: ts.status || 'CONCLUIDO',
  notes: ts.notes || ''
});

const migrateEvolution = (ev: any): EvolutionRecord => ({
  id: ev.id || generateSafeId(),
  residentId: ev.residentId || '',
  date: ev.date || new Date().toISOString().split('T')[0],
  type: ev.type || 'DIARIA',
  role: ev.role || 'TEC_ENFERMAGEM',
  filePdfBase64: ev.filePdfBase64 || undefined,
  fileName: ev.fileName || undefined,
  createdAt: ev.createdAt || new Date().toISOString()
});


// Helper central para processar o JSON cru e transformá-lo em AppData seguro
const migrateAndCleanData = (parsed: any): AppData => {
    // Se o usuário já usou o app, respeitamos os arrays dele, mesmo que vazios.
    return {
      residents: Array.isArray(parsed.residents) ? parsed.residents.map(migrateResident) : [],
      products: Array.isArray(parsed.products) ? parsed.products.map(migrateProduct) : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions.map(migrateTransaction) : [],
      prescriptions: Array.isArray(parsed.prescriptions) ? parsed.prescriptions.map(migratePrescription) : [],
      medicalAppointments: Array.isArray(parsed.medicalAppointments) ? parsed.medicalAppointments.map(migrateAppointment) : [],
      demands: Array.isArray(parsed.demands) ? parsed.demands.map(migrateDemand) : [],
      professionals: Array.isArray(parsed.professionals) ? parsed.professionals.map(migrateProfessional) : [],
      employees: Array.isArray(parsed.employees) ? parsed.employees.map(migrateEmployee) : [],
      employeeRoles: Array.isArray(parsed.employeeRoles) ? parsed.employeeRoles : INITIAL_EMPLOYEE_ROLES,
      timeSheets: Array.isArray(parsed.timeSheets) ? parsed.timeSheets.map(migrateTimeSheet) : [],
      technicalSessions: Array.isArray(parsed.technicalSessions) ? parsed.technicalSessions.map(migrateTechnicalSession) : [],
      evolutions: Array.isArray(parsed.evolutions) ? parsed.evolutions.map(migrateEvolution) : [],
      houseDocuments: Array.isArray(parsed.houseDocuments) ? parsed.houseDocuments.map(migrateHouseDocument) : [],
    };
};

export const exportData = (data: AppData) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifecare_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// --- FIRESTORE FUNCTIONS (Cloud Sync) ---

export const saveRemoteData = async (uid: string, data: AppData) => {
  try {
    // Salva o objeto inteiro do AppData em um único documento
    // users/{uid}
    await setDoc(doc(db, "users", uid), data);
  } catch (e) {
    console.error("Erro ao salvar no Firestore:", e);
    throw e; // Propagate error for UI handling if needed
  }
};

export const subscribeToUserData = (uid: string, onData: (data: AppData) => void, onError?: (error: any) => void) => {
  // Escuta mudanças em tempo real no documento do usuário
  return onSnapshot(doc(db, "users", uid), async (docSnap) => {
    if (docSnap.exists()) {
      const rawData = docSnap.data();
      // Aplica migração para garantir que novos campos existam
      const cleanData = migrateAndCleanData(rawData);
      onData(cleanData);
    } else {
      // Se não existir documento para este usuário (primeiro login),
      // cria com dados iniciais.
      console.log("Novo usuário detectado. Criando banco de dados...");
      await setDoc(doc(db, "users", uid), INITIAL_DATA_EXTENDED);
      onData(INITIAL_DATA_EXTENDED as AppData);
    }
  }, (error) => {
    console.error("Erro na subscrição do Firestore:", error);
    if (onError) onError(error);
  });
};
