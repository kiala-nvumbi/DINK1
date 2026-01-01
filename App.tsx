
import React, { useState, useEffect, useMemo } from 'react';
import { Account, JournalEntry, JournalEntryLine, Company, Profile } from './types';
import { INITIAL_ACCOUNTS } from './constants';
import { 
  LayoutDashboard, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2,
  FileText, 
  ChevronRight, 
  Sparkles,
  ArrowRightLeft,
  X,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Printer,
  Download,
  Info,
  Table as TableIcon,
  BarChart3,
  Building2,
  Calendar,
  Settings,
  ChevronDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  FileSearch,
  Layers,
  History,
  FileSpreadsheet,
  Activity,
  ShieldCheck,
  Briefcase,
  Users,
  Target,
  UserPlus,
  Mail,
  Shield,
  Eye,
  Hash
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getFinancialAdvice } from './services/gemini';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chart-of-accounts' | 'journal' | 'reports' | 'companies' | 'profiles'>('dashboard');
  const [reportSubTab, setReportSubTab] = useState<string>('balanco');
  
  // Profiles State
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('DINK_PROFILES');
    return saved ? JSON.parse(saved) : [
      { 
        id: '1', 
        name: 'Administrador Geral', 
        username: 'admin_dink', 
        userCode: 'DINK-001',
        role: 'Contabilista Certificado', 
        email: 'admin@dink.ao', 
        status: 'active',
        companyIds: ['default']
      }
    ];
  });
  const [activeProfileId, setActiveProfileId] = useState<string>(() => profiles[0]?.id || '');

  // Multi-Company State
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('DINK_COMPANIES');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Empresa Exemplo Lda', nif: '5000123456' }];
  });

  // Filtered companies based on active profile
  const visibleCompanies = useMemo(() => {
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    if (!activeProfile) return [];
    return companies.filter(c => activeProfile.companyIds.includes(c.id));
  }, [companies, profiles, activeProfileId]);

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    const saved = localStorage.getItem('DINK_ACTIVE_CO');
    return saved || 'default';
  });

  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const startYear = 2020;
    const endYear = new Date().getFullYear() + 1;
    const years = [];
    for (let y = startYear; y <= endYear; y++) years.push(y);
    return years;
  }, []);

  // Data State per Company
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  // Modals & Forms
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [isCoModalOpen, setIsCoModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingAttachments, setViewingAttachments] = useState<string[] | null>(null);
  
  const [coFormData, setCoFormData] = useState({ name: '', nif: '' });
  const [profileFormData, setProfileFormData] = useState({ 
    name: '', username: '', userCode: '', role: '', email: '', status: 'active' as const, companyIds: [] as string[]
  });
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [accFormData, setAccFormData] = useState({ code: '', name: '' });

  // Journal Form
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryLines, setEntryLines] = useState<Omit<JournalEntryLine, 'id'>[]>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 }
  ]);
  const [entryDescription, setEntryDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryAttachments, setEntryAttachments] = useState<string[]>([]);

  // Load Data
  useEffect(() => {
    const savedAccs = localStorage.getItem(`DINK_ACCOUNTS_${activeCompanyId}`);
    setAccounts(savedAccs ? JSON.parse(savedAccs) : INITIAL_ACCOUNTS);
    const savedEntries = localStorage.getItem(`DINK_ENTRIES_${activeCompanyId}`);
    setEntries(savedEntries ? JSON.parse(savedEntries) : []);
    localStorage.setItem('DINK_ACTIVE_CO', activeCompanyId);
    setAiAdvice(null);
  }, [activeCompanyId]);

  // Persist Data
  useEffect(() => {
    if (accounts.length > 0) localStorage.setItem(`DINK_ACCOUNTS_${activeCompanyId}`, JSON.stringify(accounts));
  }, [accounts, activeCompanyId]);

  useEffect(() => {
    localStorage.setItem(`DINK_ENTRIES_${activeCompanyId}`, JSON.stringify(entries));
  }, [entries, activeCompanyId]);

  useEffect(() => {
    localStorage.setItem('DINK_COMPANIES', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('DINK_PROFILES', JSON.stringify(profiles));
  }, [profiles]);

  // Financial Engine
  const filteredEntries = useMemo(() => 
    entries.filter(e => new Date(e.date).getFullYear() === activeYear), 
    [entries, activeYear]
  );

  const financialData = useMemo(() => {
    const balanceMap = new Map<string, number>();
    accounts.forEach(acc => balanceMap.set(acc.id, 0));
    
    filteredEntries.forEach(entry => {
      entry.lines.forEach(line => {
        balanceMap.set(line.accountId, (balanceMap.get(line.accountId) || 0) + (line.debit - line.credit));
      });
    });

    const rollup = (accId: string, map: Map<string, number>): number => {
      const self = map.get(accId) || 0;
      const children = accounts.filter(a => a.parentId === accId);
      return self + children.reduce((sum, child) => sum + rollup(child.id, map), 0);
    };

    const finalBalances = new Map<string, number>();
    accounts.forEach(acc => finalBalances.set(acc.id, rollup(acc.id, balanceMap)));
    return { balances: finalBalances };
  }, [accounts, filteredEntries]);

  const { balances } = financialData;

  const { totalDebitsForm, totalCreditsForm } = useMemo(() => {
    return entryLines.reduce((acc, line) => {
      acc.totalDebitsForm += (line.debit || 0);
      acc.totalCreditsForm += (line.credit || 0);
      return acc;
    }, { totalDebitsForm: 0, totalCreditsForm: 0 });
  }, [entryLines]);

  const sales = Math.abs(balances.get('6') || 0);
  const expenses = balances.get('7') || 0;
  const netIncome = sales - expenses;

  // Ratios
  const currentAssets = (balances.get('2') || 0) + (balances.get('31') || 0) + (balances.get('4') || 0);
  const currentLiabilities = Math.abs(balances.get('32') || 0) + Math.abs(balances.get('34') || 0);
  const liquidityRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : '---';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEntryAttachments(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handlers
  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now().toString();
    const newCo: Company = { id: newId, ...coFormData };
    setCompanies([...companies, newCo]);
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, companyIds: [...p.companyIds, newId] } : p));
    setCoFormData({ name: '', nif: '' });
    setIsCoModalOpen(false);
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile: Profile = { id: Date.now().toString(), ...profileFormData };
    setProfiles([...profiles, newProfile]);
    setProfileFormData({ name: '', username: '', userCode: '', role: '', email: '', status: 'active', companyIds: [] });
    setIsProfileModalOpen(false);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const isBalanced = totalDebitsForm > 0 && Math.abs(totalDebitsForm - totalCreditsForm) < 0.01;
    if (!isBalanced) return;

    const newEntry: JournalEntry = {
      id: editingEntryId || Date.now().toString(),
      date: entryDate,
      year: new Date(entryDate).getFullYear(),
      description: entryDescription,
      lines: entryLines.map(line => ({ ...line, id: Math.random().toString(36).substr(2, 9) })),
      attachments: entryAttachments
    };

    if (editingEntryId) {
      setEntries(prev => prev.map(ent => ent.id === editingEntryId ? newEntry : ent));
      setEditingEntryId(null);
    } else {
      setEntries([newEntry, ...entries]);
    }

    setEntryDescription('');
    setEntryAttachments([]);
    setEntryLines([{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm("Tem certeza que deseja apagar este lançamento?")) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEntryDescription(entry.description);
    setEntryDate(entry.date);
    setEntryLines(entry.lines.map(l => ({ accountId: l.accountId, debit: l.debit, credit: l.credit })));
    setEntryAttachments(entry.attachments || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportAllToExcel = () => {
    const co = companies.find(c => c.id === activeCompanyId);
    const wb = XLSX.utils.book_new();
    const sheets = [
      { name: "Balanço", data: [["DINK ERP V1 - Balanço"], [co?.name || ""], [""], ["ATIVO", currentAssets], ["PASSIVO", currentLiabilities]] },
      { name: "DRE", data: [["DINK ERP V1 - Demonstração de Resultados"], [co?.name || ""], [""], ["Proveitos", sales], ["Custos", expenses], ["Resultado Líquido", netIncome]] },
      { name: "Balancete", data: [["Conta", "Designação", "Saldo"], ...accounts.map(a => [a.code, a.name, balances.get(a.id) || 0])] }
    ];
    sheets.forEach(s => {
      const ws = XLSX.utils.aoa_to_sheet(s.data);
      XLSX.utils.book_append_sheet(wb, ws, s.name);
    });
    XLSX.writeFile(wb, `Contabilidade_${co?.name}_${activeYear}.xlsx`);
  };

  const currentProfile = profiles.find(p => p.id === activeProfileId);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-indigo-950 text-white flex flex-col shadow-2xl z-40">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20"><Briefcase className="w-6 h-6" /></div>
            <h1 className="text-2xl font-black tracking-tight">DINK ERP <span className="text-indigo-400">V1</span></h1>
          </div>
          <div className="bg-indigo-900/50 p-4 rounded-2xl border border-indigo-800/50">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg">{currentProfile?.name.charAt(0)}</div>
                <div className="flex-1 overflow-hidden">
                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 opacity-60">Operador Ativo</p>
                   <p className="text-sm font-bold truncate">{currentProfile?.username}</p>
                </div>
                <button onClick={() => setActiveTab('profiles')} className="p-2 hover:bg-white/10 rounded-lg"><ChevronDown size={16}/></button>
             </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Painel Geral' },
            { id: 'companies', icon: Building2, label: 'Minhas Empresas' },
            { id: 'profiles', icon: Users, label: 'Cadastro de Perfis' },
            { id: 'chart-of-accounts', icon: TableIcon, label: 'Plano de Contas' },
            { id: 'journal', icon: ArrowRightLeft, label: 'Diário Geral' },
            { id: 'reports', icon: FileText, label: 'Relatórios & PGC' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold ${activeTab === tab.id ? 'bg-indigo-600 shadow-xl' : 'hover:bg-indigo-900/50 text-indigo-300'}`}>
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-6 m-4 bg-indigo-900/30 rounded-3xl border border-indigo-800/50">
          <button onClick={() => getFinancialAdvice(`DINK ERP V1. Empresa: ${companies.find(c => c.id === activeCompanyId)?.name}. RL: ${netIncome}`).then(setAiAdvice)} className="w-full flex items-center justify-center gap-3 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold p-4 rounded-2xl shadow-lg transition-all active:scale-95">
            <Sparkles size={20} /> DINK AI Audit
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-10 py-5 flex flex-col md:flex-row gap-4 justify-between items-center z-30 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200">
              <Building2 size={18} className="text-indigo-600" />
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase">Entidade Operativa</p>
                <p className="text-sm font-bold text-slate-800">{companies.find(c => c.id === activeCompanyId)?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide">
              {availableYears.map(year => (
                <button key={year} onClick={() => setActiveYear(year)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeYear === year ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                  {year}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
               <Hash size={14} className="text-indigo-400" />
               <span className="text-xs font-black text-indigo-600">{currentProfile?.userCode}</span>
            </div>
            <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl"><Settings size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          {activeTab === 'dashboard' && (
             <div className="space-y-10 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard title="Liquidez DINK" value={liquidityRatio} type="ratio" icon={Activity} color="indigo" />
                    <StatCard title="Rentabilidade" value={sales > 0 ? ((netIncome/sales)*100).toFixed(1) + '%' : '0%'} type="ratio" icon={TrendingUp} color="emerald" />
                    <StatCard title="Tesouraria" value={balances.get('4') || 0} icon={CheckCircle2} color="indigo" />
                    <StatCard title="Resultado Líquido" value={netIncome} icon={BarChart3} color={netIncome >= 0 ? "emerald" : "rose"} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black mb-10 flex items-center gap-3 text-slate-800"><Activity className="text-indigo-600" /> Desempenho Operacional</h3>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Vendas', val: sales }, { name: 'Gastos', val: expenses }, { name: 'RL', val: netIncome }]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                          <Bar dataKey="val" radius={[10, 10, 0, 0]} barSize={60}>
                            <Cell fill="#6366f1" /><Cell fill="#f43f5e" /><Cell fill="#10b981" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-indigo-950 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                       <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Sparkles className="text-indigo-400" /> DINK Smart Audit</h3>
                       <div className="text-sm opacity-90 leading-relaxed max-h-[400px] overflow-y-auto scrollbar-hide">
                         {aiAdvice ? <div dangerouslySetInnerHTML={{ __html: aiAdvice.replace(/\n/g, '<br/>') }} /> : "Aguardando análise de performance financeira..."}
                       </div>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {activeTab === 'companies' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">Minhas Entidades</h3>
                <button onClick={() => setIsCoModalOpen(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-3 transition-all hover:scale-105 active:scale-95"><Plus size={20} /> Nova Empresa</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleCompanies.map(co => (
                  <div key={co.id} className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer ${activeCompanyId === co.id ? 'bg-indigo-50 border-indigo-500 shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200'}`} onClick={() => setActiveCompanyId(co.id)}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-white rounded-3xl shadow-sm"><Building2 className="text-indigo-600" /></div>
                      {activeCompanyId === co.id && <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase">Seleccionada</span>}
                    </div>
                    <h4 className="text-xl font-black text-slate-800 mb-2">{co.name}</h4>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">NIF: {co.nif}</p>
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                       <p className="text-xs font-black text-indigo-600 uppercase">Consultar Livros</p>
                       <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">Cadastro de Perfis</h3>
                <button onClick={() => setIsProfileModalOpen(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-3 transition-all hover:scale-105 active:scale-95"><UserPlus size={20} /> Novo Utilizador</button>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-10 py-6">Código / User</th>
                      <th className="px-10 py-6">Nome / Cargo</th>
                      <th className="px-10 py-6">E-mail</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6 text-center">Alternar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profiles.map(profile => (
                      <tr key={profile.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-10 py-6">
                           <div className="flex flex-col">
                             <span className="text-xs font-black text-indigo-600 uppercase">{profile.userCode}</span>
                             <span className="text-sm font-bold text-slate-400">@{profile.username}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">{profile.name.charAt(0)}</div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{profile.name}</span>
                              <span className="text-[10px] font-black uppercase text-slate-400 opacity-60">{profile.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-sm font-medium text-slate-400">{profile.email}</td>
                        <td className="px-10 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${profile.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {profile.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <button onClick={() => setActiveProfileId(profile.id)} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeProfileId === profile.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                            {activeProfileId === profile.id ? 'Ativo' : 'Simular'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'chart-of-accounts' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><TableIcon className="text-indigo-600" /> Plano Geral de Contas (PGC)</h3>
                <button onClick={() => { setSelectedParentId(undefined); setAccFormData({ code: '', name: '' }); setIsAccModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Plus size={18} /> Nova Conta Raiz</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black border-b">
                    <tr><th className="px-10 py-5">Código</th><th className="px-10 py-5">Designação da Conta</th><th className="px-10 py-5 text-right">Saldo Atual (AKZ)</th><th className="px-10 py-5 text-center">Gestão</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.sort((a,b) => a.code.localeCompare(b.code, undefined, {numeric: true})).map(acc => {
                      const depth = acc.code.split('.').length - 1;
                      const bal = balances.get(acc.id) || 0;
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-10 py-4 font-mono text-sm font-bold text-slate-500">{acc.code}</td>
                          <td className="px-10 py-4" style={{ paddingLeft: `${40 + (depth * 24)}px` }}>
                            <span className={depth === 0 ? 'font-black text-slate-800 uppercase' : 'font-bold text-slate-600'}>{acc.name}</span>
                          </td>
                          <td className={`px-10 py-4 text-right font-black tabular-nums ${bal < 0 ? 'text-rose-600' : 'text-indigo-950'}`}>{formatCurrency(bal)}</td>
                          <td className="px-10 py-4 text-center">
                            <div className="flex justify-center gap-2">
                               <button onClick={() => { setSelectedParentId(acc.id); setAccFormData({ code: acc.code + '.', name: '' }); setIsAccModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg" title="Adicionar Subconta"><Plus size={14} /></button>
                               {!acc.isSystem && <button onClick={() => setAccounts(prev => prev.filter(a => a.id !== acc.id))} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'journal' && (
             <div className="space-y-12 animate-in fade-in pb-20">
                {/* Journal Entry Form */}
                <div className={`p-12 rounded-[2.5rem] border shadow-xl transition-all ${editingEntryId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                  <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                    {editingEntryId ? <Edit2 className="text-indigo-600" /> : <ArrowRightLeft className="text-indigo-600" />} 
                    {editingEntryId ? "Editar Lançamento" : "Registo de Facto Patrimonial"}
                  </h3>
                  <form onSubmit={handleSaveEntry} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Histórico Narrativo</label>
                        <input value={entryDescription} onChange={e => setEntryDescription(e.target.value)} placeholder="Descrição do lançamento..." className="w-full p-4 bg-white rounded-2xl font-bold border border-slate-100 outline-none" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Data do Facto</label>
                        <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border border-slate-100 outline-none" required />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                         <Paperclip size={14} /> Inserção de Evidências (Anexos)
                       </label>
                       <div className="flex flex-wrap gap-4 items-center">
                          <label className="cursor-pointer group flex flex-col items-center justify-center w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                             <Plus size={24} className="text-slate-400 group-hover:text-indigo-600" />
                             <span className="text-[10px] font-black text-slate-400 mt-2">Upload</span>
                             <input type="file" multiple className="hidden" onChange={handleFileChange} />
                          </label>
                          {entryAttachments.map((att, i) => (
                            <div key={i} className="relative group w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200">
                               <img src={att} className="w-full h-full object-cover" alt="Documento" />
                               <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button type="button" onClick={() => setViewingAttachments([att])} className="p-2 bg-white text-indigo-600 rounded-lg"><Eye size={14}/></button>
                                  <button type="button" onClick={() => setEntryAttachments(prev => prev.filter((_, idx) => idx !== i))} className="p-2 bg-white text-rose-600 rounded-lg"><Trash2 size={14}/></button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-3">
                      {entryLines.map((line, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-4">
                          <select value={line.accountId} onChange={e => { const nl = [...entryLines]; nl[idx].accountId = e.target.value; setEntryLines(nl); }} className="flex-1 p-4 bg-white rounded-2xl font-bold border border-slate-100" required>
                            <option value="">Conta do Lançamento...</option>
                            {accounts.filter(a => a.code.includes('.')).map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                          </select>
                          <div className="flex gap-4">
                            <input type="number" placeholder="Débito" value={line.debit || ''} onChange={e => { const nl = [...entryLines]; nl[idx].debit = parseFloat(e.target.value) || 0; nl[idx].credit = 0; setEntryLines(nl); }} className="w-40 p-4 bg-emerald-50 text-emerald-700 font-black rounded-2xl" />
                            <input type="number" placeholder="Crédito" value={line.credit || ''} onChange={e => { const nl = [...entryLines]; nl[idx].credit = parseFloat(e.target.value) || 0; nl[idx].debit = 0; setEntryLines(nl); }} className="w-40 p-4 bg-rose-50 text-rose-700 font-black rounded-2xl" />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => setEntryLines([...entryLines, { accountId: '', debit: 0, credit: 0 }])} className="text-indigo-600 font-black text-xs px-4 py-2 hover:bg-indigo-50 rounded-xl transition-all">+ Nova Linha de Lançamento</button>
                    </div>
                    
                    <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                      <div className={`px-6 py-3 rounded-xl text-xs font-black ${Math.abs(totalDebitsForm - totalCreditsForm) < 0.01 && totalDebitsForm > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {Math.abs(totalDebitsForm - totalCreditsForm) < 0.01 && totalDebitsForm > 0 ? 'Status: Balanceado' : `Diferença: ${formatCurrency(Math.abs(totalDebitsForm - totalCreditsForm))}`}
                      </div>
                      <div className="flex gap-4">
                        {editingEntryId && <button type="button" onClick={() => { setEditingEntryId(null); setEntryDescription(''); setEntryLines([{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]); setEntryAttachments([]); }} className="px-8 py-5 rounded-2xl font-black text-slate-400 hover:bg-slate-100">Cancelar</button>}
                        <button disabled={totalDebitsForm === 0 || Math.abs(totalDebitsForm - totalCreditsForm) >= 0.01} className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-30">
                           {editingEntryId ? 'Gravar Alterações' : 'Confirmar Lançamento'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Journal List */}
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                   <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                      <h4 className="font-black text-slate-800 uppercase flex items-center gap-3"><History size={20} /> Histórico Diário Geral</h4>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                           <tr><th className="px-10 py-6">Data</th><th className="px-10 py-6">Descrição / Facto</th><th className="px-10 py-6">Evidências</th><th className="px-10 py-6 text-right">Montante (AKZ)</th><th className="px-10 py-6 text-center">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                           {filteredEntries.map(ent => (
                             <tr key={ent.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-10 py-6 text-sm">{new Date(ent.date).toLocaleDateString('pt-AO')}</td>
                                <td className="px-10 py-6 text-sm">{ent.description}</td>
                                <td className="px-10 py-6">
                                   {ent.attachments && ent.attachments.length > 0 ? (
                                      <button onClick={() => setViewingAttachments(ent.attachments || [])} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                         <Paperclip size={14} /> <span className="text-[10px] font-black">{ent.attachments.length} DOCS</span>
                                      </button>
                                   ) : <span className="text-[10px] opacity-20">NENHUMA</span>}
                                </td>
                                <td className="px-10 py-6 text-right font-black text-indigo-950">{formatCurrency(ent.lines.reduce((s,l) => s + l.debit, 0))}</td>
                                <td className="px-10 py-6 text-center">
                                   <div className="flex justify-center gap-2">
                                      <button onClick={() => handleEditEntry(ent)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16}/></button>
                                      <button onClick={() => handleDeleteEntry(ent.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                           {filteredEntries.length === 0 && (
                             <tr><td colSpan={5} className="p-20 text-center opacity-40 font-black uppercase tracking-widest">Aguardando registos no exercício de {activeYear}.</td></tr>
                           )}
                        </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-10 animate-in zoom-in-95">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex gap-3 bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-x-auto scrollbar-hide max-w-full">
                  {[
                    { id: 'balanco', label: 'Balanço Patrimonial', icon: Layers },
                    { id: 'dre', label: 'Demonstração de Resultados', icon: PieChart },
                    { id: 'balancete', label: 'Balancete de Verificação', icon: TableIcon },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setReportSubTab(tab.id)} className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs transition-all whitespace-nowrap ${reportSubTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-indigo-50'}`}>
                      <tab.icon size={16} /> {tab.label}
                    </button>
                  ))}
                </div>
                <button onClick={exportAllToExcel} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 whitespace-nowrap hover:scale-105 active:scale-95 transition-all"><FileSpreadsheet size={20} /> Exportar Livro Contabilístico</button>
              </div>

              <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm min-h-[600px]">
                {reportSubTab === 'balanco' && (
                  <div className="space-y-12">
                    <ReportHeader title="Balanço Patrimonial" subtitle={`Referente a 31 de Dezembro de ${activeYear}`} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                      <ReportSection title="Ativo" items={[
                        { label: "Meios Fixos (Cl. 1)", value: balances.get('1') || 0 },
                        { label: "Existências (Cl. 2)", value: balances.get('2') || 0 },
                        { label: "Terceiros Devedores (Cl. 31)", value: balances.get('31') || 0 },
                        { label: "Meios Monetários (Cl. 4)", value: balances.get('4') || 0 },
                      ]} total={(balances.get('1') || 0) + (balances.get('2') || 0) + (balances.get('31') || 0) + (balances.get('4') || 0)} />
                      <ReportSection title="Passivo e Capital Próprio" items={[
                        { label: "Capital Próprio (Cl. 5)", value: Math.abs(balances.get('5') || 0) },
                        { label: "Resultados Acumulados", value: balances.get('81') || 0 },
                        { label: "Resultado Líquido do Período", value: netIncome },
                        { label: "Terceiros Credores (Cl. 32+34)", value: currentLiabilities },
                      ]} total={Math.abs(balances.get('5') || 0) + (balances.get('81') || 0) + netIncome + currentLiabilities} />
                    </div>
                  </div>
                )}
                
                {reportSubTab === 'dre' && (
                  <div className="space-y-12">
                    <ReportHeader title="Demonstração de Resultados" subtitle={`Exercício findo em Dezembro de ${activeYear}`} />
                    <div className="space-y-8 max-w-4xl mx-auto">
                       <div className="space-y-4">
                          <h5 className="font-black text-emerald-600 uppercase text-xs tracking-widest">Proveitos e Ganhos</h5>
                          <ReportRow label="Vendas e Prestação de Serviços (Cl. 6)" val={sales} />
                       </div>
                       <div className="space-y-4">
                          <h5 className="font-black text-rose-600 uppercase text-xs tracking-widest">Custos e Perdas</h5>
                          <ReportRow label="Consumos e FSE (Cl. 71+75)" val={balances.get('7') || 0} color="rose" />
                          <ReportRow label="Custos com Pessoal (Cl. 72)" val={balances.get('72') || 0} color="rose" />
                       </div>
                       <div className="pt-10 border-t-4 border-indigo-950 flex justify-between font-black text-3xl uppercase tracking-tighter">
                          <span>Resultado Líquido</span>
                          <span className={netIncome < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatCurrency(netIncome)}</span>
                       </div>
                    </div>
                  </div>
                )}

                {reportSubTab === 'balancete' && (
                  <div className="space-y-8">
                    <ReportHeader title="Balancete de Verificação" subtitle="Saldos Acumulados por Natureza" />
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b-2 border-indigo-950 font-black text-[10px] uppercase tracking-widest">
                             <tr><th className="p-4">Conta</th><th className="p-4">Designação</th><th className="p-4 text-right">Saldo (AKZ)</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                             {accounts.map(a => (
                               <tr key={a.id} className="hover:bg-slate-50">
                                  <td className="p-4 font-mono text-xs">{a.code}</td>
                                  <td className="p-4 text-sm">{a.name}</td>
                                  <td className={`p-4 text-right tabular-nums ${ (balances.get(a.id) || 0) < 0 ? 'text-rose-600' : ''}`}>{formatCurrency(balances.get(a.id) || 0)}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Attachments Viewer Modal */}
      {viewingAttachments && (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-10">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center">
               <h4 className="font-black text-xl flex items-center gap-3"><Eye className="text-indigo-600" /> Visualização de Evidências</h4>
               <button onClick={() => setViewingAttachments(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X /></button>
            </div>
            <div className="flex-1 p-10 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 scrollbar-hide">
               {viewingAttachments.map((src, idx) => (
                 <div key={idx} className="rounded-[2.5rem] overflow-hidden border border-slate-100 bg-slate-50 flex flex-col shadow-sm">
                    <img src={src} className="w-full h-72 object-contain p-6" alt="Anexo" />
                    <div className="p-6 bg-white flex justify-between items-center border-t border-slate-100">
                       <span className="text-[10px] font-black text-slate-400">DOC_SUPORTE_00{idx+1}.PNG</span>
                       <a href={src} download={`evidencia_${idx}.png`} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Download size={18}/></a>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {isAccModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-10 bg-indigo-950 text-white flex justify-between items-center"><h3 className="font-black text-xl tracking-tight">Estrutura de Conta PGC</h3><button onClick={() => setIsAccModalOpen(false)}><X /></button></div>
            <form onSubmit={(e) => {
               e.preventDefault();
               const newAcc: Account = { id: Date.now().toString(), code: accFormData.code, name: accFormData.name, parentId: selectedParentId, type: 'mixed' };
               setAccounts([...accounts, newAcc]);
               setIsAccModalOpen(false);
            }} className="p-10 space-y-6">
              <input value={accFormData.code} onChange={e => setAccFormData({...accFormData, code: e.target.value})} placeholder="Código (Ex: 31.1.1)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100" required />
              <input value={accFormData.name} onChange={e => setAccFormData({...accFormData, name: e.target.value})} placeholder="Designação da Conta" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100" required />
              <button className="w-full bg-indigo-600 py-5 rounded-2xl text-white font-black hover:bg-indigo-700 transition-all shadow-xl">Cadastrar no Plano</button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-10 bg-indigo-950 text-white flex justify-between items-center"><h3 className="font-black text-xl tracking-tight">Novo Perfil DINK</h3><button onClick={() => setIsProfileModalOpen(false)}><X /></button></div>
            <form onSubmit={handleAddProfile} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <input value={profileFormData.username} onChange={e => setProfileFormData({...profileFormData, username: e.target.value})} placeholder="Username" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100" required />
                 <input value={profileFormData.userCode} onChange={e => setProfileFormData({...profileFormData, userCode: e.target.value})} placeholder="Código DINK-XX" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100" required />
              </div>
              <input value={profileFormData.name} onChange={e => setProfileFormData({...profileFormData, name: e.target.value})} placeholder="Nome Profissional" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100" required />
              <input value={profileFormData.role} onChange={e => setProfileFormData({...profileFormData, role: e.target.value})} placeholder="Cargo / Título" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100" required />
              
              <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase text-slate-400">Associação de Empresas</p>
                 <div className="max-h-32 overflow-y-auto space-y-2 scrollbar-hide">
                    {companies.map(co => (
                      <label key={co.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:bg-indigo-50">
                         <input type="checkbox" checked={profileFormData.companyIds.includes(co.id)} onChange={e => {
                            const ids = e.target.checked ? [...profileFormData.companyIds, co.id] : profileFormData.companyIds.filter(id => id !== co.id);
                            setProfileFormData({...profileFormData, companyIds: ids});
                         }} className="w-4 h-4 rounded text-indigo-600" />
                         <span className="text-xs font-bold text-slate-600">{co.name}</span>
                      </label>
                    ))}
                 </div>
              </div>
              <button className="w-full bg-indigo-600 py-5 rounded-2xl text-white font-black hover:bg-indigo-700 transition-all shadow-xl">Activar Perfil</button>
            </form>
          </div>
        </div>
      )}

      {/* Company Modal */}
      {isCoModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-10 bg-indigo-950 text-white flex justify-between items-center"><h3 className="font-black text-xl tracking-tight">Activação de Entidade</h3><button onClick={() => setIsCoModalOpen(false)}><X /></button></div>
            <form onSubmit={handleAddCompany} className="p-10 space-y-6">
              <input value={coFormData.name} onChange={e => setCoFormData({...coFormData, name: e.target.value})} placeholder="Designação Comercial" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100" required />
              <input value={coFormData.nif} onChange={e => setCoFormData({...coFormData, nif: e.target.value})} placeholder="NIF Oficial" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100" required />
              <button className="w-full bg-indigo-600 py-5 rounded-2xl text-white font-black hover:bg-indigo-700 transition-all shadow-xl">Activar Empresa</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// UI Components
const StatCard = ({ title, value, icon: Icon, color, type = 'currency' }: any) => {
  const colorMap: any = { indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", rose: "bg-rose-50 text-rose-600 border-rose-100" };
  return (
    <div className={`p-8 rounded-[3rem] border-2 shadow-sm transition-all hover:shadow-lg ${colorMap[color]}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
        <div className="p-2 bg-white rounded-xl shadow-sm"><Icon size={20} className="opacity-80" /></div>
      </div>
      <p className="text-2xl font-black tabular-nums tracking-tighter">
        {type === 'currency' ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value) : value}
      </p>
    </div>
  );
};

const ReportHeader = ({ title, subtitle }: any) => (
  <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-indigo-950 pb-8">
    <div>
      <h4 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">{title}</h4>
      <p className="text-slate-400 font-bold mt-2 text-lg">{subtitle}</p>
    </div>
    <div className="text-right hidden md:block">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Moeda DINK</p>
      <p className="font-black text-indigo-600 text-lg">Kwanza (AKZ)</p>
    </div>
  </div>
);

const ReportSection = ({ title, items, total }: any) => (
  <div className="space-y-6">
    <h5 className="font-black text-indigo-600 uppercase text-xs tracking-[0.2em] flex items-center gap-4">
      <div className="w-8 h-1 bg-indigo-600 rounded-full" /> {title}
    </h5>
    <div className="space-y-2">
      {items.map((item: any, i: number) => (
        <ReportRow key={i} label={item.label} val={item.value} color={item.value < 0 ? 'rose' : 'indigo'} />
      ))}
    </div>
    <div className="pt-10 border-t-2 border-indigo-950 flex justify-between font-black text-2xl text-indigo-950 uppercase tracking-tighter">
      <span>Total {title}</span>
      <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(total)}</span>
    </div>
  </div>
);

const ReportRow = ({ label, val, color = 'indigo' }: any) => (
  <div className="flex justify-between items-center py-5 text-sm font-bold text-slate-600 border-b border-slate-50 last:border-none group">
    <span className="uppercase tracking-tight group-hover:text-slate-900 transition-colors">{label}</span>
    <span className={`tabular-nums font-mono font-black ${color === 'rose' ? 'text-rose-600' : 'text-slate-800'}`}>
      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val)}
    </span>
  </div>
);

export default App;
