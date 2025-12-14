
import React, { useState, useEffect } from 'react';
import { 
    User, Key, Shield, Camera, Save, Trash2, AlertTriangle, 
    RefreshCw, X, Copy, Check, Lock
} from 'lucide-react';
import { ApiKey, SecurityActivity, UserProfile } from '../types';
import { api } from '../services/api.client';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'api_keys' | 'security'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('');
  const [board, setBoard] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Key Mgmt States
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
      setIsLoading(true);
      if (activeTab === 'profile') {
          const p = await api.getUserProfile();
          setProfile(p);
          setName(p.name);
          setEmail(p.email);
          setClassName(p.className || '');
          setBoard(p.board || '');
          setAvatarUrl(p.avatarUrl || '');
      } else if (activeTab === 'api_keys') {
          const keys = await api.getApiKeys();
          setApiKeys(keys);
      }
      setIsLoading(false);
  };

  const handleSaveProfile = async () => {
      if (!profile) return;
      setIsSaving(true);
      try {
          await api.updateUserProfile({
              ...profile,
              name,
              email,
              className,
              board,
              avatarUrl
          });
          // Mock delay for UX
          await new Promise(r => setTimeout(r, 800));
          alert("Profile updated successfully!");
      } catch (e) {
          console.error(e);
          alert("Failed to update profile.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Mock upload by creating object URL
          const url = URL.createObjectURL(file);
          setAvatarUrl(url);
      }
  };

  const handleDeleteAccount = () => {
      const confirm = window.confirm("Are you sure? This will delete all your data permanently. This action cannot be undone.");
      if (confirm) {
          alert("Account deletion request submitted. (Mock)");
      }
  };

  // ... (Keep existing API Key handlers)
  const handleCreateKey = async () => {
      if (!newKeyName) return;
      setIsLoading(true);
      try {
          const { apiKey, secret } = await api.createApiKey(newKeyName, ['read']);
          setApiKeys([...apiKeys, apiKey]);
          setCreatedSecret(secret);
          setNewKeyName('');
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleRevokeKey = async (id: string) => {
      if (!window.confirm("Are you sure?")) return;
      await api.revokeApiKey(id);
      loadData();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-20">
        <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-2">Settings</h1>
        <p className="text-[#64748B] dark:text-slate-400 mb-8">Manage your profile, security, and preferences.</p>

        {/* Tabs */}
        <div className="flex border-b border-[#E2E8F0] dark:border-slate-800 mb-8 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-[#0A1A3F] dark:border-indigo-500 text-[#0A1A3F] dark:text-indigo-400' : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'}`}
            >
                <User size={18}/> Profile
            </button>
            <button 
                onClick={() => setActiveTab('api_keys')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'api_keys' ? 'border-[#0A1A3F] dark:border-indigo-500 text-[#0A1A3F] dark:text-indigo-400' : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'}`}
            >
                <Key size={18}/> API Keys
            </button>
            <button 
                onClick={() => setActiveTab('security')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'security' ? 'border-[#0A1A3F] dark:border-indigo-500 text-[#0A1A3F] dark:text-indigo-400' : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'}`}
            >
                <Shield size={18}/> Security
            </button>
        </div>

        {/* Profile Content */}
        {activeTab === 'profile' && profile && (
            <div className="space-y-8 animate-slide-up">
                
                {/* Avatar Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start bg-white dark:bg-slate-900 p-8 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-full h-full p-6 text-slate-400" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-[#0A1A3F] dark:bg-indigo-600 rounded-full text-white cursor-pointer shadow-md hover:scale-110 transition-transform">
                            <Camera size={18} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                    </div>
                    
                    <div className="flex-1 w-full space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-[#64748B] uppercase mb-2">Full Name</label>
                                <input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-[#0A1A3F] dark:focus:border-indigo-500 transition-colors text-[#0F172A] dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#64748B] uppercase mb-2">Email Address</label>
                                <input 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-[#0A1A3F] dark:focus:border-indigo-500 transition-colors text-[#0F172A] dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#64748B] uppercase mb-2">Class / Grade (Optional)</label>
                                <input 
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    placeholder="e.g. 10th Grade"
                                    className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-[#0A1A3F] dark:focus:border-indigo-500 transition-colors text-[#0F172A] dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#64748B] uppercase mb-2">Board / University (Optional)</label>
                                <input 
                                    value={board}
                                    onChange={(e) => setBoard(e.target.value)}
                                    placeholder="e.g. CBSE, ICSE, MIT"
                                    className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-[#0A1A3F] dark:focus:border-indigo-500 transition-colors text-[#0F172A] dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="bg-[#0A1A3F] dark:bg-indigo-600 hover:bg-[#1E3A8A] text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : <><Save size={18}/> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-6 rounded-xl">
                    <h3 className="text-red-700 dark:text-red-400 font-bold flex items-center gap-2 mb-2">
                        <AlertTriangle size={20}/> Danger Zone
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                        Deleting your account is permanent. All your notes, tests, and progress will be erased.
                    </p>
                    <button 
                        onClick={handleDeleteAccount}
                        className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        )}

        {/* API Keys Content - (Simplified for brevity, same logic as before but cleaner) */}
        {activeTab === 'api_keys' && (
            <div className="space-y-6 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Active Keys</h3>
                    <button 
                        onClick={() => setShowCreateKeyModal(true)}
                        className="bg-[#0A1A3F] dark:bg-indigo-600 hover:bg-[#1E3A8A] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md"
                    >
                        + Create New Key
                    </button>
                </div>
                {/* Secret Banner */}
                {createdSecret && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg flex items-start gap-3">
                        <Check className="text-emerald-600 shrink-0 mt-0.5" size={20}/>
                        <div className="flex-1">
                            <p className="text-emerald-800 dark:text-emerald-300 font-bold mb-1">Key Created</p>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border px-3 py-2 rounded font-mono text-sm">
                                <span className="truncate flex-1">{createdSecret}</span>
                                <button onClick={() => navigator.clipboard.writeText(createdSecret)}><Copy size={16}/></button>
                            </div>
                        </div>
                        <button onClick={() => setCreatedSecret(null)}><X size={16}/></button>
                    </div>
                )}
                {/* Keys List */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 overflow-hidden shadow-sm">
                    {apiKeys.length === 0 ? (
                        <div className="p-8 text-center text-[#64748B]">No API keys found.</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#F8FAFC] dark:bg-slate-800 text-[#64748B] border-b border-[#E2E8F0] dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Token</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                                {apiKeys.map(key => (
                                    <tr key={key.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-medium">{key.name}</td>
                                        <td className="px-6 py-4 font-mono text-[#64748B]">{key.maskedKey}</td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            {key.status === 'active' && (
                                                <button onClick={() => handleRevokeKey(key.id)} className="p-1.5 text-[#64748B] hover:text-red-500"><Trash2 size={16}/></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        )}

        {/* Security Tab - Placeholder for visual completeness */}
        {activeTab === 'security' && (
            <div className="space-y-6 animate-slide-up">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
                     <h3 className="font-bold text-[#0F172A] dark:text-white mb-4">Password</h3>
                     <button className="text-sm font-bold text-[#0A1A3F] dark:text-indigo-400 border border-[#E2E8F0] dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-slate-800">Change Password</button>
                 </div>
            </div>
        )}

        {/* Create Key Modal */}
        {showCreateKeyModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#E2E8F0] dark:border-slate-800 animate-scale-up">
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-4">New API Key</h3>
                    <input 
                        autoFocus
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="Key Name (e.g. Dev)"
                        className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-4 py-2 mb-6 outline-none focus:border-[#0A1A3F]"
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowCreateKeyModal(false)} className="text-[#64748B]">Cancel</button>
                        <button onClick={() => { handleCreateKey(); setShowCreateKeyModal(false); }} className="bg-[#0A1A3F] text-white px-4 py-2 rounded-lg font-bold">Create</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Settings;
