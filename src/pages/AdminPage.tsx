import React, { useState, useEffect } from 'react';
import { useAuthStore, useStore } from '../store';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, deleteDoc, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType, cn } from '../lib/utils';
import { Shield, Plus, Activity, Users, Calendar, Settings, Play, Pause, Square, StopCircle, Trash2 } from 'lucide-react';
import { MatchStatus, Match, Team } from '../types';

export default function AdminPage() {
  const { isAdmin, isLoading, setIsAdmin } = useAuthStore();
  const { matches } = useStore();
  
  const [passcode, setPasscode] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'teams' | 'matches' | 'live'>('dashboard');
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({id: d.id, ...d.data()} as Team)));
    });
    return () => unsub();
  }, [isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '51535759') {
      localStorage.setItem('admin_passcode', '51535759');
      setIsAdmin(true);
    } else {
      alert('Invalid passcode.');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-brand-text-muted">Loading...</div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[60vh] text-center space-y-6">
        <Shield size={64} className="text-brand-neon opacity-80 neon-glow" />
        <h2 className="text-2xl font-display font-bold">Admin Control Center</h2>
        <p className="text-sm text-brand-text-muted max-w-xs">Enter administrative passcode to access the live broadcasting panel.</p>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-xs mt-4">
          <input 
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Security Code"
            className="bg-white/5 border border-white/10 rounded-xl p-4 text-center tracking-[0.25em] text-lg focus:outline-none focus:border-brand-neon transition-colors"
          />
          <button 
            type="submit"
            className="px-6 py-4 bg-brand-neon text-black font-bold rounded-xl hover:bg-opacity-90 transition-all font-display uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(0,255,102,0.3)]"
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  return (
    <div className="flex h-screen bg-[#05060A] text-white overflow-hidden pb-20 md:pb-0">
      {/* Sidebar - desktop */}
      <aside className="w-64 border-r border-white/5 bg-[#05060A]/50 backdrop-blur-xl hidden md:flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-neon/10 rounded-lg flex items-center justify-center text-brand-neon">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-display font-bold tracking-tight">Admin System</h2>
            <p className="text-[10px] text-brand-neon font-mono uppercase tracking-wider">Online</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton icon={Activity} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarButton icon={Play} label="Live Control" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
          <SidebarButton icon={Calendar} label="Matches" active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} />
          <SidebarButton icon={Users} label="Teams" active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Mobile Nav Top */}
        <div className="md:hidden flex overflow-x-auto p-4 gap-2 border-b border-white/5 custom-scrollbar sticky top-0 bg-[#05060A]/90 backdrop-blur-md z-10">
          <TabButton label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <TabButton label="Live Control" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
          <TabButton label="Matches" active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} />
          <TabButton label="Teams" active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} />
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && <DashboardView matches={matches} teams={teams} />}
          {activeTab === 'teams' && <TeamsManager teams={teams} />}
          {activeTab === 'matches' && <MatchesManager teams={teams} matches={matches} />}
          {activeTab === 'live' && (
            <LiveControlPanel 
              matches={matches} 
              teams={teams}
              selectedMatchId={selectedMatchId} 
              setSelectedMatchId={setSelectedMatchId} 
              selectedMatch={selectedMatch}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ------ Sub Components ------

function SidebarButton({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
        active ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon size={18} className={active ? "text-brand-neon" : ""} />
      {label}
    </button>
  );
}

function TabButton({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "whitespace-nowrap px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wider transition-all",
        active ? "bg-white/10 text-white border border-white/20" : "text-white/50 border border-transparent"
      )}
    >
      {label}
    </button>
  );
}

function DashboardView({ matches, teams }: { matches: Match[], teams: Team[] }) {
  const liveCount = matches.filter(m => ['KICKOFF', 'LIVE', 'FIRST_HALF', 'HT', 'SECOND_HALF', 'INJURY_TIME', 'ET', 'PENALTY'].includes(m.status)).length;
  const schedCount = matches.filter(m => m.status === 'UPCOMING' || m.status === 'STARTING_SOON').length;
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-bold">System Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Live Matches" value={liveCount} highlight />
        <StatCard title="Scheduled" value={schedCount} />
        <StatCard title="Total Teams" value={teams.length} />
        <StatCard title="Total Matches" value={matches.length} />
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight }: any) {
  return (
    <div className={cn("glass-card p-5 rounded-2xl", highlight && "neon-border-blue")}>
      <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">{title}</p>
      <div className="flex items-end gap-2">
        <span className={cn("text-4xl font-display font-extrabold", highlight ? "text-brand-neon" : "text-white")}>{value}</span>
      </div>
    </div>
  );
}

function TeamsManager({ teams }: { teams: Team[] }) {
  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, 'teams'), {
        name: fd.get('name') as string,
        shortName: (fd.get('shortName') as string).toUpperCase(),
        logo: fd.get('logo') as string || '',
        country: fd.get('country') as string || '',
        founded: fd.get('founded') as string || '',
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teams');
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2"><Plus className="text-brand-neon" /> Add New Team</h3>
        <form onSubmit={handleCreateTeam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="name" label="Full Team Name" required />
          <Input name="shortName" label="Short Name (3 Letters)" maxLength={3} required />
          <Input name="logo" label="Logo URL" placeholder="https://..." />
          <Input name="country" label="Country" />
          <Input name="founded" label="Founded Year" type="number" />
          <div className="md:col-span-2 pt-4 border-t border-white/10">
            <button type="submit" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/10">
              Create Team Record
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white/50 mb-4">Database: Teams ({teams.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {teams.map(t => (
            <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full p-2 flex-shrink-0">
                {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full bg-white/10 rounded-full" />}
              </div>
              <div>
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-xs text-white/50">{t.shortName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchesManager({ teams, matches }: { teams: Team[], matches: Match[] }) {
  const handleCreateMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const homeTeamId = fd.get('homeTeamId') as string;
    const awayTeamId = fd.get('awayTeamId') as string;
    const hTeam = teams.find(t => t.id === homeTeamId);
    const aTeam = teams.find(t => t.id === awayTeamId);
    
    if (!hTeam || !aTeam || homeTeamId === awayTeamId) return alert('Select valid opposing teams');

    try {
      await addDoc(collection(db, 'matches'), {
        homeTeamId,
        homeTeamName: hTeam.name,
        homeTeamLogo: hTeam.logo,
        awayTeamId,
        awayTeamName: aTeam.name,
        awayTeamLogo: aTeam.logo,
        homeScore: 0,
        awayScore: 0,
        status: 'UPCOMING' as MatchStatus,
        league: fd.get('league') as string || '',
        matchDate: fd.get('matchDate') as string || '',
        matchTime: fd.get('matchTime') as string || '',
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      (e.target as HTMLFormElement).reset();
      
      try {
        await addDoc(collection(db, 'notifications'), {
          title: 'New Fixture Scheduled',
          message: `${hTeam.name} vs ${aTeam.name} has been added.`,
          type: 'system',
          visibility: 'public',
          createdAt: serverTimestamp()
        });
      } catch (err) {}
      
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'matches');
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2"><Calendar className="text-brand-neon" /> Schedule Fixture</h3>
        <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select name="homeTeamId" label="Home Team" options={teams.map(t => ({value: t.id, label: t.name}))} required />
          <Select name="awayTeamId" label="Away Team" options={teams.map(t => ({value: t.id, label: t.name}))} required />
          <Input name="league" label="League / Competition" />
          <div className="grid grid-cols-2 gap-4">
            <Input name="matchDate" label="Date" type="date" />
            <Input name="matchTime" label="Time" type="time" />
          </div>
          <div className="md:col-span-2 pt-4 border-t border-white/10">
            <button type="submit" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/10">
              Generate Fixture
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white/50 mb-4">Upcoming & Recent</h3>
        <div className="space-y-3">
          {matches.map(m => (
            <div key={m.id} className="glass-card p-4 rounded-xl flex items-center justify-between text-sm">
              <span className="font-mono text-white/50 w-24 text-xs">{m.status}</span>
              <span className="flex-1 font-bold text-right">{m.homeTeamName}</span>
              <span className="font-mono mx-4 font-bold text-brand-neon">{m.homeScore} - {m.awayScore}</span>
              <span className="flex-1 font-bold text-left">{m.awayTeamName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveControlPanel({ matches, teams, selectedMatchId, setSelectedMatchId, selectedMatch }: any) {
  
  const [commentary, setCommentary] = useState<any[]>([]);

  React.useEffect(() => {
    if (!selectedMatchId) return;
    const unsub = onSnapshot(
      query(collection(db, `matches/${selectedMatchId}/commentary`), orderBy('createdAt', 'desc')),
      (snap) => {
        setCommentary(snap.docs.map(d => ({id: d.id, ...d.data()})));
      }
    );
    return () => unsub();
  }, [selectedMatchId]);

  const createNotification = async (title: string, message: string, type: 'system' | 'match_update' | 'goal' = 'system') => {
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        type,
        visibility: 'public',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to send notification', e);
    }
  };

  const handleUpdate = async (updates: Partial<Match>) => {
    if (!selectedMatchId) return;
    try {
      await updateDoc(doc(db, 'matches', selectedMatchId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      if (updates.status) {
        createNotification('Match Status Updated', `${selectedMatch?.homeTeamName} vs ${selectedMatch?.awayTeamName} is now ${updates.status.replace('_', ' ')}`, 'match_update');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `matches/${selectedMatchId}`);
    }
  };

  const handleGoal = async (team: 'home' | 'away', type: 'add' | 'remove') => {
    if (!selectedMatch) return;
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    const current = selectedMatch[key];
    const newScore = type === 'add' ? current + 1 : Math.max(0, current - 1);
    
    await handleUpdate({ [key]: newScore });
    
    if (type === 'add') {
      const teamName = team === 'home' ? selectedMatch.homeTeamName : selectedMatch.awayTeamName;
      const scorer = window.prompt("Enter Goal Scorer name (optional):");
      const goalText = scorer ? `GOAL! ${scorer} scores for ${teamName}!` : `GOAL! ${teamName} scores!`;
      
      await handleAddEvent({
        text: goalText,
        type: 'goal',
        minute: selectedMatch.minute || "1'",
        teamId: team === 'home' ? selectedMatch.homeTeamId : selectedMatch.awayTeamId
      });
      createNotification('GOAL!', goalText, 'goal');
    }
  };

  const handleAddEvent = async (event: any) => {
    if (!selectedMatchId) return;
    try {
      await addDoc(collection(db, `matches/${selectedMatchId}/commentary`), {
        matchId: selectedMatchId,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...event
      });
      if (['goal', 'red_card', 'info'].includes(event.type)) {
        createNotification(
          event.type === 'goal' ? 'GOAL!' : event.type === 'red_card' ? 'RED CARD!' : 'Match Update',
          event.text,
          event.type === 'goal' ? 'goal' : 'match_update'
        );
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, `matches/${selectedMatchId}/commentary`);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end relative z-50">
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#00FFF0] mb-2">Target Match (All Matches Available)</label>
          <div 
            onClick={() => setShowSelector(!showSelector)}
            className="w-full bg-black border border-brand-neon/30 rounded-xl p-4 font-medium cursor-pointer flex items-center justify-between focus-within:border-brand-neon focus-within:ring-1 focus-within:ring-brand-neon transition-all"
          >
            <span className={selectedMatch ? "text-white" : "text-white/50"}>
              {selectedMatch 
                ? `${selectedMatch.homeTeamName} vs ${selectedMatch.awayTeamName} — ${selectedMatch.status.replace('_', ' ')}`
                : "-- Select Match to Control --"}
            </span>
            <div className="text-brand-neon">▼</div>
          </div>

          {showSelector && (
            <div className="absolute top-[80px] left-0 w-full bg-[#0A0A0C] border border-brand-neon/30 rounded-xl mt-2 overflow-hidden shadow-2xl z-50 flex flex-col">
               <div className="p-3 border-b border-white/10">
                 <input 
                   type="text"
                   autoFocus
                   placeholder="Search matches, teams, league..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-brand-neon"
                 />
               </div>
               <div className="max-h-64 overflow-y-auto custom-scrollbar">
                 {matches
                   .filter(m => `${m.homeTeamName} ${m.awayTeamName} ${m.league} ${m.status}`.toLowerCase().includes(searchTerm.toLowerCase()))
                   .map(m => (
                     <div 
                       key={m.id}
                       onClick={() => { setSelectedMatchId(m.id); setShowSelector(false); setSearchTerm(''); }}
                       className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 border-b border-white/5 last:border-0"
                     >
                        <div className="flex flex-col">
                           <span className="font-bold text-[13px]">{m.homeTeamName} vs {m.awayTeamName}</span>
                           <span className="text-[10px] text-white/50 uppercase tracking-wide">{m.league} • {m.matchDate} {m.matchTime}</span>
                        </div>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase",
                          m.status.includes('LIVE') || m.status.includes('HALF') || m.status.includes('ET') || m.status.includes('INJURY') ? "bg-brand-neon/20 text-brand-neon" : "bg-white/10 text-white/50"
                        )}>{m.status.replace('_', ' ')}</span>
                     </div>
                 ))}
                 {matches.length === 0 && <div className="p-4 text-center text-[11px] text-white/40">No matches found.</div>}
               </div>
            </div>
          )}
        </div>
      </div>

      {selectedMatch && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Match Info Update Panel */}
          <div className="glass-card p-6 rounded-3xl space-y-6 lg:col-span-2">
             <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white/50 border-b border-white/10 pb-4">Edit Match Info</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <Input 
                 name="league" 
                 label="League Name" 
                 value={selectedMatch.league || ''} 
                 onChange={(e: any) => handleUpdate({league: e.target.value})} 
               />
               <Input 
                 name="homeTeamName" 
                 label="Home Team Name" 
                 value={selectedMatch.homeTeamName || ''} 
                 onChange={(e: any) => handleUpdate({homeTeamName: e.target.value})} 
               />
               <Input 
                 name="awayTeamName" 
                 label="Away Team Name" 
                 value={selectedMatch.awayTeamName || ''} 
                 onChange={(e: any) => handleUpdate({awayTeamName: e.target.value})} 
               />
               <Input 
                 name="matchDate" 
                 type="date"
                 label="Update Date" 
                 value={selectedMatch.matchDate || ''} 
                 onChange={(e: any) => handleUpdate({matchDate: e.target.value})} 
               />
               <Input 
                 name="matchTime" 
                 type="time"
                 label="Update Time" 
                 value={selectedMatch.matchTime || ''} 
                 onChange={(e: any) => handleUpdate({matchTime: e.target.value})} 
               />
               <Input 
                 name="stadium" 
                 label="Stadium" 
                 value={selectedMatch.stadium || ''} 
                 onChange={(e: any) => handleUpdate({stadium: e.target.value})} 
               />
               <Input 
                 name="homeTeamLogo" 
                 label="Home Logo URL" 
                 value={selectedMatch.homeTeamLogo || ''} 
                 onChange={(e: any) => handleUpdate({homeTeamLogo: e.target.value})} 
               />
               <Input 
                 name="awayTeamLogo" 
                 label="Away Logo URL" 
                 value={selectedMatch.awayTeamLogo || ''} 
                 onChange={(e: any) => handleUpdate({awayTeamLogo: e.target.value})} 
               />
             </div>
          </div>

          {/* Status & Clock Control */}
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white/50 border-b border-white/10 pb-4">Match State & Clock</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatusButton current={selectedMatch.status} target="UPCOMING" onClick={() => handleUpdate({status: 'UPCOMING'})} />
              <StatusButton current={selectedMatch.status} target="WARMUP" onClick={() => handleUpdate({status: 'WARMUP'})} />
              <StatusButton current={selectedMatch.status} target="STARTING_SOON" onClick={() => handleUpdate({status: 'STARTING_SOON'})} />
              <StatusButton current={selectedMatch.status} target="KICKOFF" isLive onClick={() => handleUpdate({status: 'KICKOFF', minute: "1'"})} />
              <StatusButton current={selectedMatch.status} target="LIVE" isLive onClick={() => handleUpdate({status: 'LIVE'})} />
              <StatusButton current={selectedMatch.status} target="FIRST_HALF" label="1ST HALF" isLive onClick={() => handleUpdate({status: 'FIRST_HALF'})} />
              <StatusButton current={selectedMatch.status} target="INJURY_TIME" label="+ INJURY TIME" isLive onClick={() => handleUpdate({status: 'INJURY_TIME'})} />
              <StatusButton current={selectedMatch.status} target="HT" onClick={() => handleUpdate({status: 'HT', minute: "HT"})} />
              <StatusButton current={selectedMatch.status} target="SECOND_HALF" label="2ND HALF" isLive onClick={() => handleUpdate({status: 'SECOND_HALF', minute: "45'"})} />
              <StatusButton current={selectedMatch.status} target="ET" label="EXTRA TIME" isLive onClick={() => handleUpdate({status: 'ET'})} />
              <StatusButton current={selectedMatch.status} target="PENALTY" isLive onClick={() => handleUpdate({status: 'PENALTY'})} />
              <StatusButton current={selectedMatch.status} target="SUSPENDED" onClick={() => handleUpdate({status: 'SUSPENDED'})} />
              <StatusButton current={selectedMatch.status} target="DELAYED" onClick={() => handleUpdate({status: 'DELAYED'})} />
              <StatusButton current={selectedMatch.status} target="ABANDONED" onClick={() => handleUpdate({status: 'ABANDONED'})} />
              <StatusButton current={selectedMatch.status} target="FINISHED" label="FULL TIME" onClick={() => handleUpdate({status: 'FINISHED', minute: "FT"})} />
            </div>

            <div className="pt-4 border-t border-white/10 flex items-end gap-4">
                 <div className="flex-1 w-full relative">
                   <Input 
                     name="minute" 
                     label="Manual Clock (e.g. 45+2')" 
                     value={selectedMatch.minute || ''} 
                     onChange={(e: any) => handleUpdate({minute: e.target.value})} 
                   />
                 </div>
                 <button onClick={() => handleUpdate({status: 'UPCOMING', homeScore: 0, awayScore: 0, minute: ''})} className="flex items-center gap-1.5 px-4 py-3 h-[52px] bg-brand-red/20 border border-brand-red/30 text-brand-red rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-brand-red/30 transition-colors whitespace-nowrap">
                   Reset Match
                 </button>
            </div>
          </div>

          {/* Score Control */}
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white/50 border-b border-white/10 pb-4">Live Score Control</h3>
            
            <div className="flex items-center justify-between gap-4">
               
               <div className="flex-1 flex flex-col items-center gap-4 glass-card p-4 rounded-2xl bg-white/5">
                 <span className="font-bold uppercase tracking-wide text-sm">{selectedMatch.homeTeamName}</span>
                 <span className="text-6xl font-display font-extrabold">{selectedMatch.homeScore}</span>
                 <div className="flex gap-2 w-full">
                    <ActionButton icon={Minus} onClick={() => handleGoal('home', 'remove')} />
                    <ActionButton icon={Plus} label="GOAL" primary onClick={() => handleGoal('home', 'add')} />
                 </div>
               </div>

               <div className="text-2xl font-bold text-white/20">VS</div>

               <div className="flex-1 flex flex-col items-center gap-4 glass-card p-4 rounded-2xl bg-white/5">
                 <span className="font-bold uppercase tracking-wide text-sm">{selectedMatch.awayTeamName}</span>
                 <span className="text-6xl font-display font-extrabold">{selectedMatch.awayScore}</span>
                 <div className="flex gap-2 w-full">
                    <ActionButton icon={Plus} label="GOAL" primary onClick={() => handleGoal('away', 'add')} />
                    <ActionButton icon={Minus} onClick={() => handleGoal('away', 'remove')} />
                 </div>
               </div>

            </div>
          </div>

          {/* Events Injector */}
          <div className="glass-card p-6 rounded-3xl lg:col-span-2">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white/50 border-b border-white/10 pb-4 mb-4">Event Injector</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleAddEvent({
                minute: fd.get('minute'),
                type: fd.get('type'),
                text: fd.get('text')
              });
              (e.target as HTMLFormElement).reset();
            }} className="flex flex-wrap md:flex-nowrap gap-4 items-end">
              <div className="w-24"><Input name="minute" label="Min" placeholder="74'" required /></div>
              <div className="w-40"><Select name="type" label="Type" options={[
                {value: 'info', label: 'Info'}, {value: 'goal', label: 'Goal'}, 
                {value: 'yellow_card', label: 'Yellow Card'}, {value: 'red_card', label: 'Red Card'},
                {value: 'sub', label: 'Substitution'}, {value: 'var', label: 'VAR'},
              ]} required /></div>
              <div className="flex-1"><Input name="text" label="Commentary Text" required /></div>
              <button type="submit" className="h-[52px] px-6 bg-brand-accent text-white font-bold rounded-xl whitespace-nowrap">Push Event</button>
            </form>
          </div>

          {/* Full Match Monitor */}
          <div className="glass-card p-6 rounded-3xl lg:col-span-2">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white/50 border-b border-white/10 pb-4 mb-4 flex items-center justify-between">
              <span>Full Match Monitor</span>
              <span className="text-xs bg-brand-neon/20 text-brand-neon px-2 py-1 rounded-full">{commentary.length} Events</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {commentary.length === 0 ? (
                <div className="text-center text-white/30 py-8 text-sm">No match events published yet.</div>
              ) : (
                commentary.map(c => (
                  <div key={c.id} className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group">
                    <span className="font-mono text-brand-neon text-sm w-12 flex-shrink-0">{c.minute}</span>
                    <span className="text-xs uppercase font-bold text-white/50 w-20 flex-shrink-0">{c.type.replace('_', ' ')}</span>
                    <span className="flex-1 text-sm">{c.text}</span>
                    <button 
                      onClick={() => deleteDoc(doc(db, `matches/${selectedMatchId}/commentary`, c.id))}
                      className="text-white/30 hover:text-brand-red p-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ------ UI Helpers ------

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2">
    {label && <label className="text-xs font-bold uppercase tracking-wider text-white/50">{label}</label>}
    <input {...props} style={{ colorScheme: 'dark' }} className="w-full bg-[#05060A] text-white border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-neon transition-colors" />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="flex flex-col gap-2">
    {label && <label className="text-xs font-bold uppercase tracking-wider text-white/50">{label}</label>}
    <select {...props} className="w-full bg-[#05060A] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-neon transition-colors appearance-none text-white">
      <option value="">Select...</option>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const StatusButton = ({ current, target, label, isLive, onClick }: any) => {
  const active = current === target;
  return (
    <button onClick={onClick} className={cn(
      "p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all h-full text-center flex flex-col justify-center items-center gap-1",
      active ? (isLive ? "bg-brand-red/20 border-brand-red text-white" : "bg-white/20 border-white text-white") : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
    )}>
      {active && isLive && <div className="w-1.5 h-1.5 rounded-full live-pulse bg-white"></div>}
      {label || target}
    </button>
  );
}

const ActionButton = ({ icon: Icon, label, primary, onClick }: any) => (
  <button onClick={onClick} className={cn(
    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-xs transition-colors border",
    primary ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" : "bg-black/50 border-white/5 hover:bg-white/5 text-white/50"
  )}>
    <Icon size={16} />
    {label && <span>{label}</span>}
  </button>
);

const Minus = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>;
