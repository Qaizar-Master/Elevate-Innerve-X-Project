
import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, Mail, Loader2, User } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic Validation
    if (!email || !password) {
        setError("Please fill in all fields.");
        return;
    }
    if (mode === 'SIGNUP') {
        if (!name) {
            setError("Name is required.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#0F172A] flex items-center justify-center p-4 animate-fade-in relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#1E3A8A]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#0A1A3F]/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-[#1E293B]">
        <div className="p-8 pb-6">
           <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A1A3F] to-[#1E3A8A] flex items-center justify-center shadow-lg shadow-[#1E3A8A]/30">
                    <Layers size={28} className="text-white"/>
                </div>
           </div>
           
           <h2 className="text-2xl font-bold text-center text-[#0F172A] mb-2">
             {mode === 'LOGIN' ? 'Welcome back' : 'Create Account'}
           </h2>
           <p className="text-center text-[#64748B] text-sm mb-8">
             {mode === 'LOGIN' ? 'Enter your details to access Elevate' : 'Start your AI-powered learning journey'}
           </p>

           {error && (
               <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center border border-red-100 font-medium animate-shake">
                   {error}
               </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'SIGNUP' && (
                  <div className="space-y-1 animate-slide-down">
                      <label className="text-xs font-bold text-[#334155] uppercase tracking-wide ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-3 top-3 text-[#94A3B8] group-focus-within:text-[#0A1A3F] transition-colors" size={18} />
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-[#0A1A3F] focus:bg-white transition-all font-medium"
                          placeholder="John Doe"
                        />
                      </div>
                  </div>
              )}

              <div className="space-y-1">
                  <label className="text-xs font-bold text-[#334155] uppercase tracking-wide ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 text-[#94A3B8] group-focus-within:text-[#0A1A3F] transition-colors" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-[#0A1A3F] focus:bg-white transition-all font-medium"
                      placeholder="student@example.com"
                    />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-[#334155] uppercase tracking-wide ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 text-[#94A3B8] group-focus-within:text-[#0A1A3F] transition-colors" size={18} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-[#0A1A3F] focus:bg-white transition-all font-medium"
                      placeholder="••••••••"
                    />
                  </div>
              </div>

              {mode === 'SIGNUP' && (
                  <div className="space-y-1 animate-slide-down">
                      <label className="text-xs font-bold text-[#334155] uppercase tracking-wide ml-1">Confirm Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3 text-[#94A3B8] group-focus-within:text-[#0A1A3F] transition-colors" size={18} />
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-[#0A1A3F] focus:bg-white transition-all font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                  </div>
              )}

              {mode === 'LOGIN' && (
                  <div className="flex items-center justify-between pt-2">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0A1A3F] focus:ring-[#0A1A3F]" />
                        <span className="text-xs text-[#64748B] font-medium">Remember me</span>
                     </label>
                     <a href="#" className="text-xs text-[#1E3A8A] font-bold hover:underline">Forgot password?</a>
                  </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0A1A3F] hover:bg-[#1E3A8A] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#0A1A3F]/20 transition-all flex items-center justify-center gap-2 mt-6"
              >
                {isLoading ? (
                    <><Loader2 className="animate-spin" size={18}/> Processing...</>
                ) : (
                    <>{mode === 'LOGIN' ? 'Sign In' : 'Create Account'} <ArrowRight size={18}/></>
                )}
              </button>
           </form>
        </div>

        <div className="px-8 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] text-center">
            <p className="text-sm text-[#64748B]">
                {mode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}
                <button 
                    onClick={() => { setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); setError(null); }}
                    className="ml-1 text-[#0A1A3F] font-bold hover:underline focus:outline-none"
                >
                    {mode === 'LOGIN' ? 'Sign up' : 'Sign in'}
                </button>
            </p>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-[#64748B]/60 text-xs">
         © 2024 Elevate Learning AI.
      </div>
    </div>
  );
};

export default AuthScreen;
