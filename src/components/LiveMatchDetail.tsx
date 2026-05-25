import React, { useState } from 'react';
import { Match, Commentary } from '../types';
import { cn } from '../lib/utils';
import { Clock, Users, PieChart, Shield } from 'lucide-react';

export default function LiveMatchDetail({ match, commentary }: { match: Match, commentary: Commentary[] }) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'lineups'>('timeline');

  return (
    <div className="w-full flex flex-col h-full bg-[#05060A]">
      {/* Top Match Info Section - Extremely Compact */}
      <div className="bg-black/60 border-b border-white/5 pb-2 pt-2 px-3 flex flex-col gap-2 relative shadow-lg">
        {/* League & Status */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">KGHS SPORTS LEAGUE</span>
          <div className="flex items-center gap-1.5 bg-brand-red/10 border border-brand-red/20 px-2 py-0.5 rounded text-[9px] text-brand-red uppercase font-bold tracking-widest shadow-[0_0_8px_rgba(255,45,85,0.15)]">
            {(match.status === 'LIVE' || match.status === 'HT' || match.status === 'SECOND_HALF' || match.status === 'ET' || match.status === 'PENALTY') && <span className="w-1.5 h-1.5 rounded-full bg-brand-red live-pulse" />}
            {match.status.replace('_', ' ')} {match.minute ? ` ${match.minute}` : ''}
          </div>
        </div>

        {/* Teams and Score Horizontal */}
        <div className="flex items-center justify-between bg-white/5 rounded-lg border border-white/10 p-2">
          {/* Home */}
          <div className="flex items-center gap-2 w-[40%]">
            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center p-0.5 shrink-0">
              <img src={match.homeTeamLogo || '/vite.svg'} alt={match.homeTeamName} className="w-full h-full object-contain" />
            </div>
            <span className="text-[11px] font-bold text-white uppercase truncate">{match.homeTeamName}</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center justify-center w-[20%] text-center shrink-0">
            <div className="text-[16px] font-display font-extrabold text-white tracking-tight leading-none">
              <span className={match.status === 'LIVE' || match.status === 'SECOND_HALF' ? 'text-brand-neon' : ''}>{match.homeScore}</span>
              <span className="text-white/30 mx-1">-</span>
              <span className={match.status === 'LIVE' || match.status === 'SECOND_HALF' ? 'text-brand-neon' : ''}>{match.awayScore}</span>
            </div>
            {match.minute && <span className="text-[9px] font-mono font-bold text-white/50 mt-1">{match.minute}'</span>}
          </div>

          {/* Away */}
          <div className="flex items-center gap-2 w-[40%] justify-end">
            <span className="text-[11px] font-bold text-white uppercase truncate">{match.awayTeamName}</span>
            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center p-0.5 shrink-0">
              <img src={match.awayTeamLogo || '/vite.svg'} alt={match.awayTeamName} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[9px] text-white/40 font-medium px-1">
          <div className="flex items-center gap-1"><Shield size={10} /> Stadium • Round 5</div>
          <div>{match.status === 'UPCOMING' ? 'Upcoming' : match.status === 'FINISHED' ? 'Finished' : 'Live'}</div>
        </div>
      </div>

      {/* Match Momentum */}
      <div className="bg-[#05060A] px-3 pt-4 pb-2 border-b border-white/5">
         <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase font-bold text-white/50 tracking-wider">Match Momentum</span>
            <span className="text-[8px] text-white/30 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">Live Data</span>
         </div>
         <div className="w-full h-8 flex items-end gap-1 relative overflow-hidden group">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -translate-y-1/2"></div>
            {/* Generating mock momentum bars based on commentary density, or just visualizing ebb and flow */}
            {Array.from({ length: 40 }).map((_, i) => {
              // Creating a realistic-looking flow
              const isHome = Math.sin(i * 0.4) > 0;
              const height = (Math.abs(Math.sin(i * 0.4)) * 80) + Math.random() * 20;
              const isEvent = Math.random() > 0.9;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end relative h-full">
                  {isHome ? (
                    <div 
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-300", 
                        isEvent ? "bg-brand-neon shadow-[0_0_8px_rgba(0,255,102,0.5)] z-10" : "bg-white/20"
                      )} 
                      style={{ height: `${height}%`, maxHeight: '50%', transformOrigin: 'bottom' }} 
                    />
                  ) : (
                    <div className="w-full h-1/2 relative bg-transparent">
                      <div 
                        className={cn(
                          "absolute top-0 left-0 w-full rounded-b-sm transition-all duration-300",
                          isEvent ? "bg-brand-red shadow-[0_0_8px_rgba(255,45,85,0.5)] z-10" : "bg-white/10"
                        )}
                        style={{ height: `${height}%`, maxHeight: '100%' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
         </div>
      </div>

      {/* TABS */}
      <div className="flex bg-[#05060A] border-b border-white/5 sticky top-0 z-20">
        <button onClick={() => setActiveTab('timeline')} className={cn("flex-1 py-3 text-[10px] uppercase font-bold tracking-wider relative flex justify-center items-center gap-1.5 transition-colors", activeTab === 'timeline' ? "text-brand-neon" : "text-white/40 hover:text-white/70")}>
          <Clock size={12} /> Timeline
          {activeTab === 'timeline' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-neon shadow-[0_0_8px_rgba(0,255,102,0.5)]" />}
        </button>
        <button onClick={() => setActiveTab('stats')} className={cn("flex-1 py-3 text-[10px] uppercase font-bold tracking-wider relative flex justify-center items-center gap-1.5 transition-colors", activeTab === 'stats' ? "text-brand-neon" : "text-white/40 hover:text-white/70")}>
          <PieChart size={12} /> Stats
          {activeTab === 'stats' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-neon shadow-[0_0_8px_rgba(0,255,102,0.5)]" />}
        </button>
        <button onClick={() => setActiveTab('lineups')} className={cn("flex-1 py-3 text-[10px] uppercase font-bold tracking-wider relative flex justify-center items-center gap-1.5 transition-colors", activeTab === 'lineups' ? "text-brand-neon" : "text-white/40 hover:text-white/70")}>
          <Users size={12} /> Lineups
          {activeTab === 'lineups' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-neon shadow-[0_0_8px_rgba(0,255,102,0.5)]" />}
        </button>
      </div>

      {/* CONTENT PORTION */}
      <div className="flex-1 overflow-y-auto px-3 py-4 pb-20 custom-scrollbar relative">
        {activeTab === 'timeline' && (
          <div className="flex flex-col gap-3">
             {commentary.length === 0 ? (
               <div className="text-[10px] text-center text-white/30 py-6 border border-white/5 rounded-lg border-dashed">No timeline events recorded yet.</div>
             ) : (
               commentary.map((c) => {
                 const isGoal = c.type === 'goal';
                 const isCard = c.type.includes('card');
                 const isRed = c.type === 'red_card';
                 return (
                   <div key={c.id} className="flex gap-3 bg-white/5 p-2.5 rounded-lg border border-white/5 items-center relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                     {isGoal && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-neon shadow-[0_0_8px_rgba(0,255,102,0.5)]" />}
                     {isRed && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-red" />}
                     {(isCard && !isRed) && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FF9F0A]" />}
                     <div className="w-8 text-right shrink-0">
                       <span className={cn("text-[10px] font-mono font-bold", isGoal ? "text-brand-neon" : "text-white/50")}>{c.minute}</span>
                     </div>
                     <div className="flex-1 text-[11px] font-medium leading-tight text-white/90">
                       {c.text}
                     </div>
                   </div>
                 )
               })
             )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Mocking stats since there's no actual data yet, as per user's soft requirement. If we bind real data later, we can read from props */}
            <StatRow label="Ball Possession" home={55} away={45} suffix="%" />
            <StatRow label="Goal Attempts" home={12} away={8} />
            <StatRow label="Shots on Goal" home={4} away={3} />
            <StatRow label="Fouls" home={10} away={14} />
            <StatRow label="Yellow Cards" home={1} away={3} />
            <StatRow label="Red Cards" home={0} away={0} />
            <StatRow label="Corner Kicks" home={6} away={4} />
            <StatRow label="Offsides" home={2} away={1} />
            <StatRow label="Pass Accuracy" home={88} away={82} suffix="%" />
          </div>
        )}

        {activeTab === 'lineups' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase text-white/80 text-center mb-1">Starting XI</div>
                <PlayerRow number={1} name="Alisson" pos="GK" rating="7.5" home />
                <PlayerRow number={4} name="Van Dijk" pos="DF" rating="8.1" home captain />
                <PlayerRow number={66} name="Alexander-Arnold" pos="DF" rating="7.8" home yellow />
                <PlayerRow number={11} name="Salah" pos="FW" rating="8.5" home goal />
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase text-white/80 text-center mb-1">Starting XI</div>
                <PlayerRow number={31} name="Ederson" pos="GK" rating="7.0" />
                <PlayerRow number={3} name="Dias" pos="DF" rating="7.4" />
                <PlayerRow number={17} name="De Bruyne" pos="MF" rating="9.1" captain assist />
                <PlayerRow number={9} name="Haaland" pos="FW" rating="8.8" goal />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2 border-t border-white/5 pt-4">
              <div className="flex flex-col gap-2">
                <div className="text-[9px] uppercase font-bold text-white/40 mb-1">Substitutes</div>
                <PlayerRow number={20} name="Jota" pos="FW" rating="-" sub />
                <PlayerRow number={7} name="Diaz" pos="FW" rating="6.5" subIn />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[9px] uppercase font-bold text-white/40 mb-1">Substitutes</div>
                <PlayerRow number={19} name="Alvarez" pos="FW" rating="6.8" subIn goal />
                <PlayerRow number={47} name="Foden" pos="MD" rating="-" sub />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatRow({ label, home, away, suffix = '' }: any) {
  const total = home + away;
  const homePct = total === 0 ? 50 : (home / total) * 100;
  const awayPct = total === 0 ? 50 : (away / total) * 100;
  
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[10px] font-bold text-white/80 uppercase px-1">
        <span>{home}{suffix}</span>
        <span className="text-white/40 text-[9px] tracking-wider">{label}</span>
        <span>{away}{suffix}</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full flex overflow-hidden">
        <div className="h-full bg-brand-neon transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-white/30 transition-all duration-500" style={{ width: `${awayPct}%` }} />
      </div>
    </div>
  )
}

function PlayerRow({ number, name, pos, rating, captain, yellow, red, goal, assist, sub, subIn, home }: any) {
  return (
    <div className="flex items-center justify-between text-[10px] p-1.5 rounded hover:bg-white/5 border border-transparent transition-colors group">
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <span className="w-4 text-center font-mono font-bold text-white/30 text-[9px]">{number}</span>
        <span className="text-[10px] font-medium text-white/90 truncate mr-1 relative">
           {name}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {captain && <span className="text-[8px] bg-brand-neon/20 text-brand-neon px-1 rounded-sm font-bold">C</span>}
        {goal && <span className="w-2 h-2 rounded-full bg-white border border-[#05060A]" title="Goal" />}
        {assist && <span className="text-[8px] text-white/50 px-1 font-bold">A</span>}
        {yellow && <span className="w-2 h-2.5 bg-[#FF9F0A] rounded-sm border border-[#05060A]" title="Yellow Card" />}
        {red && <span className="w-2 h-2.5 bg-brand-red rounded-sm border border-[#05060A]" title="Red Card" />}
        <span className={cn("text-[9px] font-bold font-mono px-1 rounded w-5 text-center", rating !== '-' ? "bg-white/10 text-brand-neon" : "text-white/30")}>
          {rating}
        </span>
      </div>
    </div>
  )
}
