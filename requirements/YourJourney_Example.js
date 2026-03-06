import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  Bookmark, 
  MoreHorizontal, 
  Search, 
  Filter, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  LayoutDashboard,
  History,
  PlusCircle,
  User,
  LogOut,
  ChevronRight,
  Bell
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('Your Journey');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Mock Data
  const stats = [
    { label: 'Total Challenges', value: 42, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active', value: 12, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Completed', value: 28, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Saved Artifacts', value: 156, icon: Bookmark, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const activeChallenges = [
    {
      id: 'CH-102',
      title: 'Scaling User Discovery',
      summary: 'Establishing a continuous discovery habit across 3 cross-functional teams.',
      status: 'In Progress',
      artifact: 'Opportunity Solution Tree',
      progress: 65,
      category: 'Discovery'
    },
    {
      id: 'CH-105',
      title: 'Q3 Product Strategy',
      summary: 'Defining North Star metrics and high-level initiatives for the growth squad.',
      status: 'In Progress',
      artifact: 'Working Backwards (Amazon)',
      progress: 40,
      category: 'Strategy'
    },
    {
      id: 'CH-108',
      title: 'Churn Reduction Plan',
      summary: 'Analyzing onboarding friction points and cohort retention data.',
      status: 'In Progress',
      artifact: 'Retention Lifecycle Framework',
      progress: 15,
      category: 'Growth'
    }
  ];

  const historyData = [
    { id: 'CH-099', title: 'Feature Prioritization', summary: 'Aligning stakeholders on the H2 roadmap.', status: 'Completed', category: 'Strategy', artifact: 'RICE Scoring', date: 'Oct 12, 2023', progress: 100 },
    { id: 'CH-098', title: 'Developer API Launch', summary: 'Go-to-market strategy for external devs.', status: 'Archived', category: 'Growth', artifact: 'GTM Playbook', date: 'Oct 05, 2023', progress: 100 },
    { id: 'CH-097', title: 'Mobile App Refresh', summary: 'UI/UX overhaul for iOS/Android.', status: 'Abandoned', category: 'Discovery', artifact: 'Jobs to be Done', date: 'Sep 28, 2023', progress: 20 },
    { id: 'CH-095', title: 'Team Hiring Plan', summary: 'Hiring 3 Senior PMs for the scale-up.', status: 'Completed', category: 'Leadership', artifact: 'Competency Matrix', date: 'Sep 15, 2023', progress: 100 },
  ];

  const contentTypes = [
    { type: 'Frameworks', count: 18, percentage: 45 },
    { type: 'Playbooks', count: 12, percentage: 30 },
    { type: 'Founder Stories', count: 6, percentage: 15 },
    { type: 'Anti-Patterns', count: 4, percentage: 10 },
  ];

  const thoughtLeaders = [
    { name: 'Marty Cagan', challenges: 14, img: 'https://ui-avatars.com/api/?name=Marty+Cagan&background=random' },
    { name: 'Lenny Rachitsky', challenges: 11, img: 'https://ui-avatars.com/api/?name=Lenny+Rachitsky&background=random' },
    { name: 'Teresa Torres', challenges: 8, img: 'https://ui-avatars.com/api/?name=Teresa+Torres&background=random' },
  ];

  const filteredHistory = useMemo(() => {
    return historyData.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Header Navigation */}
      <header className="fixed top-0 w-full bg-white border-b border-slate-200 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
                <BrainCircuit className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">Contexta</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {[
                { name: 'Home', icon: LayoutDashboard },
                { name: 'Your Journey', icon: TrendingUp },
                { name: 'New Challenge', icon: PlusCircle },
                { name: 'History', icon: History },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === item.name 
                    ? 'bg-slate-100 text-indigo-700' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700">Alex Chen</p>
                <p className="text-[10px] text-slate-400 font-medium">Senior PM</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden transition-transform group-hover:scale-105">
                <img src="https://ui-avatars.com/api/?name=Alex+PM" alt="User" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-6 max-w-[1400px] mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Journey</h1>
            <p className="text-slate-500 mt-1 font-medium text-lg">Personal workspace & challenge history.</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95 text-sm">
            <PlusCircle className="w-5 h-5" />
            New Challenge
          </button>
        </div>

        {/* Section 1: Journey Insights */}
        <section className="grid grid-cols-12 gap-6 mb-12">
          {/* Stats Cards */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-100 transition-colors">
                <div className={`${stat.bg} ${stat.color} w-11 h-11 rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Distribution Small Chart */}
          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2 uppercase tracking-wider">
              <Bookmark className="w-4 h-4 text-indigo-500" />
              Artifact Usage
            </h3>
            <div className="space-y-4">
              {contentTypes.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-[11px] mb-1.5 font-bold uppercase tracking-wide">
                    <span className="text-slate-600">{item.type}</span>
                    <span className="text-slate-400">{item.count} items</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thought Leaders Row */}
          <div className="col-span-12 bg-white px-8 py-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
            <div className="flex flex-col md:border-r border-slate-100 md:pr-12">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Curation Sources</span>
              <span className="text-sm font-bold text-slate-700 mt-1 whitespace-nowrap">Top Thought Leaders</span>
            </div>
            <div className="flex gap-8 flex-1 overflow-x-auto py-2 scrollbar-hide">
              {thoughtLeaders.map((leader, idx) => (
                <div key={idx} className="flex items-center gap-4 group cursor-default min-w-fit">
                  <div className="relative">
                    <img src={leader.img} className="w-10 h-10 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110" alt={leader.name} />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{leader.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{leader.challenges} CHALLENGES</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Active Challenges */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
              <div className="w-2.5 h-8 bg-orange-400 rounded-full shadow-sm" />
              Active Challenges
            </h2>
            <button className="bg-slate-200/50 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold transition-colors">View All Active</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeChallenges.map((challenge) => (
              <div key={challenge.id} className="group bg-white rounded-3xl border border-slate-200 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300">
                <div className="flex justify-between items-start mb-5">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 ${
                    challenge.category === 'Discovery' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    challenge.category === 'Strategy' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-purple-50 text-purple-700 border-purple-100'
                  }`}>
                    {challenge.category}
                  </span>
                  <button className="text-slate-300 hover:text-slate-600 p-1 bg-slate-50 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-700 transition-colors mb-2 truncate">{challenge.title}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 font-medium leading-relaxed">
                  {challenge.summary}
                </p>
                
                <div className="bg-slate-50 rounded-2xl p-4 mb-8 flex flex-col gap-3 border border-slate-100/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px] uppercase tracking-wide">{challenge.artifact}</span>
                    </div>
                    <span className="text-[11px] font-black text-indigo-600">{challenge.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-700" style={{ width: `${challenge.progress}%` }}></div>
                  </div>
                </div>

                <button className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all group-hover:shadow-lg group-hover:shadow-indigo-100">
                  Continue Challenge
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Challenge Overview Table */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-gradient-to-r from-white to-slate-50/30">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Challenge History</h2>
              <p className="text-slate-400 text-sm font-medium mt-0.5">Full archive of your product decisions.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search challenges or artifacts..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <select 
                  className="appearance-none pl-5 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer min-w-[160px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                  <option value="Abandoned">Abandoned</option>
                </select>
                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.15em] border-b border-slate-100">
                  <th className="px-8 py-5">Challenge Detail</th>
                  <th className="px-8 py-5">Context</th>
                  <th className="px-8 py-5">Artifact Used</th>
                  <th className="px-8 py-5 text-center">Progress</th>
                  <th className="px-8 py-5">Lifecycle</th>
                  <th className="px-8 py-5">Finished</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{item.title}</span>
                        <span className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">{item.summary}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md tracking-wider">{item.category}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Bookmark className="w-3.5 h-3.5 text-slate-300" />
                        {item.artifact}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col items-center gap-2 min-w-[100px]">
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-400'}`} 
                            style={{ width: `${item.progress}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{item.progress}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 ${
                        item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        item.status === 'Archived' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs text-slate-500 font-bold">{item.date}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2.5 bg-white shadow-sm border border-slate-200 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredHistory.length === 0 && (
            <div className="p-20 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm">
                <Search className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-800">No matching challenges</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm mt-2 font-medium">Try broadening your search criteria or checking a different status.</p>
            </div>
          )}

          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center px-8 gap-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Showing {filteredHistory.length} of {historyData.length} records</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-xs font-black text-slate-300 cursor-not-allowed uppercase tracking-widest">Prev</button>
              <button className="px-5 py-2 text-xs font-black text-slate-700 bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-all uppercase tracking-widest">Next Page</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;