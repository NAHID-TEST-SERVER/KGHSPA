import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store';
import { MatchCard } from '../components/MatchCard';
import LiveMatchDetail from '../components/LiveMatchDetail';
import { Match, MatchStatus, Commentary } from '../types';
import { handleFirestoreError, OperationType, cn } from '../lib/utils';
import { Activity, Bell } from 'lucide-react';

function EmbeddedLiveMatch({ match }: { match: Match }) {
  const [commentary, setCommentary] = useState<Commentary[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, `matches/${match.id}/commentary`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Commentary[];
      setCommentary(comments);
    });
    return () => unsubscribe();
  }, [match.id]);

  return (
    <div className="border border-brand-neon/30 rounded-2xl overflow-hidden bg-[#0A0A0C] shadow-[0_0_20px_rgba(0,255,102,0.1)] flex flex-col h-[600px] mb-4">
      <LiveMatchDetail match={match} commentary={commentary} />
    </div>
  );
}

export default function HomePage({ filter }: { filter?: MatchStatus }) {
  const { matches } = useStore();
  const [reminders, setReminders] = useState<string[]>([]);
  // Use local filter state that initializes from prop, but allows internal switching
  const [localFilter, setLocalFilter] = useState<string>(filter || 'ALL');

  // Update local filter if prop changes (e.g. navigation)
  useEffect(() => {
    setLocalFilter(filter || 'ALL');
  }, [filter]);

  useEffect(() => {
    const updateReminders = () => {
      const saved = JSON.parse(localStorage.getItem('savedReminderMatches') || '[]');
      setReminders(saved);
    };
    updateReminders();
    window.addEventListener('remindersUpdated', updateReminders);
    return () => window.removeEventListener('remindersUpdated', updateReminders);
  }, []);

  const isMatchLive = (m: Match) => ['KICKOFF', 'LIVE', 'FIRST_HALF', 'HT', 'SECOND_HALF', 'INJURY_TIME', 'ET', 'PENALTY'].includes(m.status);

  let displayMatches = matches;
  if (localFilter === 'LIVE') {
    displayMatches = matches.filter(isMatchLive);
  } else if (localFilter === 'UPCOMING') {
    displayMatches = matches.filter(m => m.status === 'UPCOMING' || m.status === 'STARTING_SOON');
  } else if (localFilter === 'FINISHED') {
    displayMatches = matches.filter(m => m.status === 'FINISHED');
  }

  let reminderMatches: Match[] = [];
  if (localFilter === 'UPCOMING') {
    reminderMatches = displayMatches.filter(m => reminders.includes(m.id));
    displayMatches = displayMatches.filter(m => !reminders.includes(m.id));
  }

  const liveMatches = matches.filter(isMatchLive);

  return (
    <div className="p-4 space-y-6 bg-[#05060A] min-h-screen">
      {/* Featured Live Match */}
      {!filter && liveMatches.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-[#00FFF0]">Featured Live</h3>
          </div>
          <div className="space-y-4">
            {liveMatches.slice(0, 1).map((match) => (
              <MatchCard key={match.id} match={match} featured />
            ))}
          </div>
        </section>
      )}

      {/* Fixtures: Reminders Section */}
      {filter === 'UPCOMING' && reminderMatches.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-2 mb-6 border-b border-white/5 pb-6">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-1.5 text-[#00FFF0]">
               <Bell size={12} className="live-pulse" />
               <h3 className="font-display text-[10px] font-bold uppercase tracking-widest">Reminders Active</h3>
             </div>
             <span className="text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider">
               {reminderMatches.length} SAVED
             </span>
          </div>
          <div className="space-y-2">
            {reminderMatches.map((match) => (
              <div key={match.id} className="relative">
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Matches Switcher */}
      <section className="animate-in fade-in slide-in-from-bottom-3">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex bg-white/5 p-1 rounded-lg">
            {['ALL', 'LIVE', 'UPCOMING', 'FINISHED'].map((f) => (
              <button
                key={f}
                onClick={() => setLocalFilter(f)}
                className={cn(
                  "flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all",
                  localFilter === f ? "bg-brand-neon/10 text-brand-neon shadow-[0_0_10px_rgba(0,255,102,0.1)]" : "text-white/40 hover:text-white/70"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-white/50">
              {localFilter === 'LIVE' ? 'Live Matches' : localFilter === 'UPCOMING' ? 'Upcoming Fixtures' : localFilter === 'FINISHED' ? 'Recent Results' : 'All Matches'}
            </h3>
            <span className="text-brand-neon bg-brand-neon/10 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider">
              {displayMatches.length} MATCHES
            </span>
          </div>
        </div>
        
        {displayMatches.length === 0 && reminderMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-2xl text-center border-dashed border border-white/5 mx-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <Activity className="text-white/20" size={18} />
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">No matches currently</p>
          </div>
        ) : (
          <div className="space-y-2">
            {localFilter === 'LIVE' && displayMatches.length === 1 ? (
              <EmbeddedLiveMatch match={displayMatches[0]} />
            ) : (
              displayMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            )}
          </div>
        )}
      </section>

      {/* Quick Player Stats Preview */}
      {!filter && (
        <section className="animate-in fade-in slide-in-from-bottom-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-white/50">Top Performers</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
            <div className="shrink-0 w-32 bg-[#0A0A0C] border border-white/5 rounded-xl p-3 pt-4 flex flex-col items-center relative">
              <div className="absolute top-2 left-2 text-[8px] bg-[#FF9F0A]/20 text-[#FF9F0A] pl-1 pr-1 font-bold rounded">GOALS</div>
              <div className="w-10 h-10 rounded-full bg-white/5 mb-2 mt-2"></div>
              <div className="text-[10px] font-bold text-white mb-0.5 text-center truncate w-full">M. Salah</div>
              <div className="text-[9px] text-white/40 text-center uppercase tracking-wider">KGH-A</div>
              <div className="mt-2 text-[14px] font-display font-bold text-brand-neon">12</div>
            </div>
            <div className="shrink-0 w-32 bg-[#0A0A0C] border border-white/5 rounded-xl p-3 pt-4 flex flex-col items-center relative">
              <div className="absolute top-2 left-2 text-[8px] bg-[#00A3FF]/20 text-[#00A3FF] pl-1 pr-1 font-bold rounded">ASSISTS</div>
              <div className="w-10 h-10 rounded-full bg-white/5 mb-2 mt-2"></div>
              <div className="text-[10px] font-bold text-white mb-0.5 text-center truncate w-full">K. De Bruyne</div>
              <div className="text-[9px] text-white/40 text-center uppercase tracking-wider">KGH-B</div>
              <div className="mt-2 text-[14px] font-display font-bold text-[#00A3FF]">8</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
