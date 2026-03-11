import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Clock, 
  Info, 
  Users, 
  Zap, 
  Lightbulb, 
  Mic, 
  PlayCircle, 
  BookOpen, 
  ArrowRight 
} from 'lucide-react';

const ArtifactDetail = ({ selectedArtifact, onBack, onOpenContent }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'how-to-use'

  // Fallback mock data if none provided
  const art = selectedArtifact || {
    title: 'Opportunity Solution Tree',
    domain: 'Discovery',
    time: '15 min read',
    description: 'Ein visueller Workflow, der hilft, klare Ziele zu setzen und Lösungen direkt mit Kundenproblemen zu verknüpfen.',
    stage: 'Growth / Series A-B',
    thoughtLeaders: ['Teresa Torres', 'Marty Cagan'],
    howToUse: [
      { step: '1. Outcome festlegen', detail: 'Definieren Sie eine messbare Business-Metrik.' },
      { step: '2. Opportunities mappen', detail: 'Identifizieren Sie Kundenbedürfnisse.' }
    ],
    relatedContent: [
      { id: '1', title: 'Discovery Deep Dive', speaker: 'Teresa Torres', type: 'Podcast', source: 'Spotify', duration: '45 min' },
      { id: '2', title: 'OST Masterclass', speaker: 'John Cutler', type: 'Video', source: 'YouTube', duration: '12 min' },
      { id: '3', title: 'Strategy Frameworks', speaker: 'Melissa Perri', type: 'Article', source: 'Medium', duration: '8 min' }
    ]
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-6xl mx-auto pb-20 px-4">
      {/* Navigation Upper */}
      <button 
        onClick={onBack} 
        className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        Back to recommendations
      </button>

      {/* Header Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            {art.domain}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={14} /> {art.time}
          </span>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">{art.title}</h1>
        
        {/* Tabbed View Switcher */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-6 text-sm font-bold transition-all relative ${
              activeTab === 'overview' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('how-to-use')}
            className={`pb-4 px-6 text-sm font-bold transition-all relative ${
              activeTab === 'how-to-use' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            How to use
            {activeTab === 'how-to-use' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Main View Area */}
        <div className="lg:col-span-2 min-h-[400px]">
          {activeTab === 'overview' ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-10">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info size={20} className="text-indigo-600" /> About this Artifact
                </h3>
                <p className="text-xl text-gray-600 leading-relaxed">{art.description}</p>
              </section>

              {/* Metadata Cards Integrated into Overview */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Eignung & Fokus</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Company Stage</p>
                      <p className="text-sm font-semibold text-gray-800">{art.stage}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Domäne</p>
                      <p className="text-sm font-semibold text-gray-800">{art.domain}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Thought Leaders</h4>
                  <div className="space-y-3">
                    {art.thoughtLeaders?.map(leader => (
                      <div key={leader} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Users size={14} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{leader}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <section className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100/50">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                  <Zap className="text-indigo-600" size={24} /> Prozessschritte
                </h2>
                <div className="space-y-8">
                  {art.howToUse?.map((item, idx) => (
                    <div key={idx} className="flex gap-6 group">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-200">
                        {idx + 1}
                      </div>
                      <div className="pt-1">
                        <h4 className="font-bold text-lg text-gray-900 mb-2">
                          {item.step.includes('. ') ? item.step.split('. ')[1] : item.step}
                        </h4>
                        <p className="text-gray-600 leading-relaxed">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:col-span-1 sticky top-24">
          <div className="p-8 bg-indigo-900 rounded-3xl text-white shadow-xl shadow-indigo-100">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Lightbulb className="text-indigo-300" size={24} />
            </div>
            <h4 className="font-bold text-lg mb-3">Contexta AI Pro-Tipp</h4>
            <p className="text-indigo-100 leading-relaxed mb-6 italic text-sm">
              "Kombinieren Sie dieses Framework mit kontinuierlichen Kundeninterviews, um den Baum wöchentlich zu aktualisieren. Fokus auf Outcomes statt Features!"
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 rounded-xl font-bold text-sm">
              In Playbook speichern
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Knowledge Base */}
      <section className="mt-20">
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Wissensdatenbank</h2>
            <p className="text-sm text-gray-500">Zusammenfassungen passend zu {art.title}</p>
          </div>
          <div className="flex gap-2">
             <button className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-400 hover:text-indigo-600 transition-all">
               <ChevronLeft size={20} />
             </button>
             <button className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-400 hover:text-indigo-600 transition-all">
               <ChevronRight size={20} />
             </button>
          </div>
        </div>

        {/* Custom scroll container */}
        <div className="overflow-x-auto flex gap-6 pb-6 px-2 no-scrollbar scroll-smooth">
          {art.relatedContent?.map((content) => (
            <div 
              key={content.id}
              onClick={() => onOpenContent && onOpenContent(content)}
              className="flex-shrink-0 w-80 group p-6 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded-xl ${
                  content.type === 'Podcast' ? 'bg-orange-50 text-orange-600' : 
                  content.type === 'Video' ? 'bg-blue-50 text-blue-600' : 
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {content.type === 'Podcast' ? <Mic size={22} /> : content.type === 'Video' ? <PlayCircle size={22} /> : <BookOpen size={22} />}
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{content.type}</span>
              </div>
              <h4 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2 min-h-[3.5rem]">
                {content.title}
              </h4>
              <p className="text-sm text-gray-500 mb-6 font-medium">{content.speaker} • {content.source}</p>
              <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <Clock size={14} /> {content.duration}
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all">
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Global utility for hiding scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ArtifactDetail;