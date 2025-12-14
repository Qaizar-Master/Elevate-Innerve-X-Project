
import React, { useState, useEffect } from 'react';
import { 
    ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip
} from 'recharts';
import { UserStats } from '../types';
import { api } from '../services/api.client';
import { 
    Activity, ArrowRight, BookOpen, Clock, FileText, CheckCircle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchStats = async () => {
          const data = await api.getUserStats();
          setStats(data);
          setLoading(false);
      };
      fetchStats();
  }, []);

  if (loading || !stats) return <div className="p-10 text-center text-[#64748B]">Loading progress...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-20 p-6">
      
      <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-6">Learning Dashboard</h1>

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-2">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                  <BookOpen size={24}/>
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">PDFs Studied</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">12</p>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                  <Clock size={24}/>
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Time Spent</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">4.5h</p>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                  <CheckCircle size={24}/>
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Questions</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">128</p>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                  <FileText size={24}/>
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Tests Taken</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">5</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Mastery */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity size={18} className="text-indigo-500"/> Concept Mastery Progress
                    </h3>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.skills}>
                                <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Mastery"
                                    dataKey="masteryScore"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fill="#6366f1"
                                    fillOpacity={0.3}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
                        {stats.skills.map(skill => (
                            <div key={skill.skillId} className="flex flex-col gap-1 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{skill.name}</h4>
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{skill.masteryScore}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${skill.masteryScore}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
          </div>

          {/* RIGHT: Recommendations */}
          <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <ArrowRight size={18} className="text-emerald-500"/> Recommended Actions
                  </h3>
                  <div className="space-y-4">
                      {stats.weakAreas.map((area, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl flex items-start gap-3 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm">
                              <div className="mt-1"><BookOpen size={16} className="text-indigo-500"/></div>
                              <div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Revise {area.topic}</p>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {area.fixTitle}
                                  </div>
                              </div>
                          </div>
                      ))}
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl flex items-start gap-3 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm">
                          <div className="mt-1"><FileText size={16} className="text-emerald-500"/></div>
                          <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Take a Practice Test</p>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                  Focus on Physics Mechanics
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
