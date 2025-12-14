import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, FileText, Activity } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
    const data = [
        { name: 'Class 10A', avgScore: 78, attendance: 92 },
        { name: 'Class 10B', avgScore: 85, attendance: 95 },
        { name: 'Class 11A', avgScore: 72, attendance: 88 },
        { name: 'Class 11B', avgScore: 80, attendance: 90 },
    ];

    const weakTopics = [
        { name: 'Thermodynamics', value: 40 },
        { name: 'Calculus', value: 30 },
        { name: 'Organic Chem', value: 30 },
    ];

    const COLORS = ['#0A1A3F', '#1E3A8A', '#64748B'];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        <header>
            <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Teacher Command Center</h2>
            <p className="text-[#64748B]">Class Performance Analytics & Insights</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2 text-[#0A1A3F]">
                    <Users size={24}/>
                    <h3 className="text-lg font-bold">Total Students</h3>
                </div>
                <p className="text-4xl font-black text-[#0F172A]">124</p>
                <p className="text-sm text-[#64748B] mt-1">Across 4 sections</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3 mb-2 text-[#1E3A8A]">
                    <FileText size={24}/>
                    <h3 className="text-lg font-bold">Assignments Pending</h3>
                </div>
                <p className="text-4xl font-black text-[#0F172A]">12</p>
                <p className="text-sm text-[#64748B] mt-1">To be graded by AI</p>
            </div>
             <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3 mb-2 text-[#64748B]">
                    <Activity size={24}/>
                    <h3 className="text-lg font-bold">Avg Performance</h3>
                </div>
                <p className="text-4xl font-black text-[#0F172A]">78%</p>
                <p className="text-sm text-[#10B981] mt-1">↑ 4% from last week</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
                <h3 className="text-[#0F172A] font-bold mb-6">Class Average Scores</h3>
                <div className="w-full min-h-[300px] flex-1">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <XAxis dataKey="name" stroke="#64748B" />
                            <YAxis stroke="#64748B" />
                            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#F1F5F9'}} />
                            <Bar dataKey="avgScore" fill="#0A1A3F" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
                 <h3 className="text-[#0F172A] font-bold mb-6">Critical Weak Topics</h3>
                 <div className="w-full min-h-[300px] flex-1 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={weakTopics}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {weakTopics.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend wrapperStyle={{ color: '#0F172A' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default TeacherDashboard;