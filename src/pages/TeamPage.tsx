import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { Team, Match } from '../types';
import { ArrowLeft, Users, Navigation, MapPin, CalendarDays, Award } from 'lucide-react';
import { MatchCard } from '../components/MatchCard';
import { cn } from '../lib/utils';

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    // Fetch team details
    const fetchTeam = async () => {
      try {
        const docRef = doc(db, 'teams', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTeam({ id: docSnap.id, ...docSnap.data() } as Team);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Sub to all matches for this team
    const matchesQ = query(
      collection(db, 'matches')
    );

    const unsubMatches = onSnapshot(matchesQ, (snap) => {
      const all: Match[] = snap.docs.map(d => ({id: d.id, ...d.data()}) as Match);
      // Filter here because Firestore OR queries can be tricky
      const teamMatches = all.filter(m => m.homeTeamId === id || m.awayTeamId === id);
      
      const finished = teamMatches
        .filter(m => m.status === 'FINISHED')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5); // Last 5
        
      const upcoming = teamMatches
        .filter(m => m.status !== 'FINISHED')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      setRecentMatches(finished);
      setUpcomingMatches(upcoming);
      setLoading(false);
    });

    fetchTeam();
    return () => unsubMatches();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-white/50 animate-pulse font-display">Loading Team Data...</div>;
  }

  if (!team) {
    return (
      <div className="p-8 flex flex-col items-center">
        <h2 className="text-xl font-display font-medium mb-4">Team not found</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-white/10 rounded-full">Go Back</button>
      </div>
    );
  }

  // Calculate form (W/D/L)
  const getFormBadge = (match: Match) => {
    const isHome = match.homeTeamId === id;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const oppScore = isHome ? match.awayScore : match.homeScore;

    if (teamScore > oppScore) return { label: 'W', color: 'bg-brand-neon text-black shadow-[0_0_10px_#00FF66]' };
    if (teamScore === oppScore) return { label: 'D', color: 'bg-brand-text-muted text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' };
    return { label: 'L', color: 'bg-brand-red text-white shadow-[0_0_10px_#FF2D55]' };
  };

  return (
    <div className="bg-[#05060A] min-h-screen text-white pb-24">
      {/* Header Banner */}
      <div className="relative h-48 bg-gradient-to-b from-brand-accent/20 to-[#05060A] overflow-hidden">
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
          {team.logo && <img src={team.logo} alt="" className="w-64 h-64 object-contain filter blur-md" />}
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md z-10"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Main Info */}
      <div className="px-6 relative -mt-16 z-10 mb-8">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-[#05060A] border-4 border-[#05060A] p-2 flex items-center justify-center shadow-xl mb-4 glass-card relative overflow-hidden">
             {team.logo ? <img src={team.logo} alt={team.name} className="w-24 h-24 object-contain" /> : <div className="w-full h-full bg-white/5 rounded-full" />}
          </div>
          <h1 className="text-3xl font-display font-extrabold uppercase tracking-tight text-center mb-1">{team.name}</h1>
          <span className="text-white/50 font-mono text-sm tracking-widest">{team.shortName}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <InfoCard icon={MapPin} label="Country" value={team.country || 'N/A'} />
          <InfoCard icon={Navigation} label="Stadium" value={team.stadium || 'N/A'} />
          <InfoCard icon={Users} label="Coach" value={team.coach || 'N/A'} />
          <InfoCard icon={CalendarDays} label="Founded" value={team.founded || 'N/A'} />
        </div>
      </div>

      <div className="px-6 space-y-8">
        {/* Recent Form */}
        <section>
           <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
             <Award size={16} /> Recent Form
           </h3>
           <div className="glass-card p-4 rounded-3xl flex justify-center gap-3">
             {recentMatches.length === 0 && <span className="text-white/40 text-sm">No recent matches</span>}
             {recentMatches.map(m => {
               const form = getFormBadge(m);
               return (
                 <div key={m.id} className={cn("w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold font-display text-lg", form.color)} title={`${m.homeTeamName} ${m.homeScore} - ${m.awayScore} ${m.awayTeamName}`}>
                   {form.label}
                 </div>
               );
             })}
           </div>
        </section>

        {/* Fixtures & Results */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white/50">Matches</h3>
          </div>
          <div className="space-y-4">
            {upcomingMatches.map(m => <MatchCard key={m.id} match={m} />)}
            {/* Show recent matches if no upcoming */}
            {upcomingMatches.length === 0 && recentMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      </div>

    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: any) {
  return (
    <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-neon">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{label}</p>
        <p className="text-sm font-medium leading-tight truncate w-full">{value}</p>
      </div>
    </div>
  );
}
