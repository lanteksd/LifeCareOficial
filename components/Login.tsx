
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { HeartHandshake, Mail, Lock, Loader2, ArrowRight, CheckCircle2, ShieldCheck, Activity, Users } from 'lucide-react';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      const firebaseError = err as AuthError;
      console.error(firebaseError);
      
      switch (firebaseError.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Email ou senha incorretos.');
          break;
        case 'auth/email-already-in-use':
          setError('Este email já está cadastrado.');
          break;
        case 'auth/weak-password':
          setError('A senha deve ter pelo menos 6 caracteres.');
          break;
        case 'auth/invalid-email':
          setError('Email inválido.');
          break;
        default:
          setError('Ocorreu um erro. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 flex flex-col lg:flex-row">
      
      {/* Presentation Side (Left) */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary-600 to-blue-800 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[500px] lg:min-h-auto shrink-0">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
           <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-300 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
               <HeartHandshake size={32} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">LifeCare</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Gestão inteligente para Casas de Repouso.
          </h1>
          <p className="text-blue-100 text-lg lg:text-xl max-w-md leading-relaxed">
            Um sistema completo para gerenciar cuidados, estoque, equipe e o bem-estar dos seus residentes.
          </p>
        </div>

        <div className="relative z-10 grid gap-6 mt-12 lg:mt-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                 <Users size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-lg">Prontuário Unificado</h3>
                 <p className="text-blue-200 text-sm">Histórico clínico, social e pessoal.</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-lg">Conformidade & Segurança</h3>
                 <p className="text-blue-200 text-sm">Controle de documentos e vigências.</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                 <Activity size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-lg">Gestão de Estoque</h3>
                 <p className="text-blue-200 text-sm">Controle de medicamentos e insumos.</p>
              </div>
           </div>
        </div>

        <div className="relative z-10 text-xs text-blue-300 mt-8">
           © {new Date().getFullYear()} LifeCare Systems
        </div>
      </div>

      {/* Login Side (Right) */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 shrink-0">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl lg:shadow-none border border-slate-100 lg:border-none p-8 lg:p-0">
          
          <div className="mb-8 text-center lg:text-left">
             <h2 className="text-3xl font-bold text-slate-800 mb-2">
               {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
             </h2>
             <p className="text-slate-500">
               {isLogin ? 'Acesse o painel administrativo.' : 'Preencha os dados para começar.'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar no Sistema' : 'Cadastrar Instituição'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              {isLogin ? 'Não tem uma conta?' : 'Já possui cadastro?'}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="ml-2 font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
