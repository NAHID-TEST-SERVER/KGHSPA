import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types';
import { cn } from '../lib/utils';
import { Clock, Bell } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  featured?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, featured = false }) => {
  const isLive = match.status === 'LIVE' || match.status === 'HT' || match.status === 'SECOND_HALF' || match.status === 'ET' || match.status === 'PENALTY';
  const isUpcoming = match.status === 'UPCOMING' || match.status === 'STARTING_SOON' || match.status === 'WARMUP';
  
  const [isReminderSet, setIsReminderSet] = useState(false);

  useEffect(() => {
    if (isUpcoming) {
      const saved = JSON.parse(localStorage.getItem('savedReminderMatches') || '[]');
      setIsReminderSet(saved.includes(match.id));
    }
  }, [match.id, isUpcoming]);

  const toggleReminder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('savedReminderMatches') || '[]');
    let newSaved;
    if (saved.includes(match.id)) {
      newSaved = saved.filter((id: string) => id !== match.id);
      setIsReminderSet(false);
    } else {
      newSaved = [...saved, match.id];
      setIsReminderSet(true);
    }
    localStorage.setItem('savedReminderMatches', JSON.stringify(newSaved));
    // Optional: trigger custom event if needed globally
    window.dispatchEvent(new Event('remindersUpdated'));
  };

  return (
    <Link 
      to={`/match/${match.id}`}
      className={cn(
        "block relative overflow-hidden transition-all duration-300",
        featured ? "bg-black/40 p-3 rounded-xl border border-[#00FFF0]/20 shadow-[0_0_15px_rgba(0,255,240,0.05)]" : "bg-[#0A0A0C] p-2.5 rounded-lg border border-white/5 hover:bg-white/[0.02]"
      )}
    >
      {/* Decorative gradient for live matches */}
      {isLive && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-neon shadow-[0_0_8px_rgba(0,255,102,0.5)]" />
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center mb-2 pl-1.5 relative z-10 w-full">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <div className="flex items-center gap-1 bg-brand-red/10 border border-brand-red/20 px-1 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red live-pulse"></span>
              <span className="text-[8px] font-bold tracking-widest text-brand-red uppercase">{match.status.replace('_', ' ')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-white/40 font-bold uppercase tracking-wider">
              <Clock size={10} />
              <span className="text-[8px]">{match.status.replace('_', ' ')}</span>
            </div>
          )}
          <span className="text-[8px] text-white/30 uppercase tracking-widest font-bold ml-1">KGHS League</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isLive && match.minute && (
            <span className="text-[10px] font-mono font-bold text-brand-neon">{match.minute}'</span>
          )}
          {isUpcoming && (
            <button 
              onClick={toggleReminder}
              className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Bell 
                size={12} 
                className={cn(
                  "transition-all duration-300",
                  isReminderSet ? "fill-[#00FFF0] text-[#00FFF0] drop-shadow-[0_0_5px_rgba(0,255,240,0.5)] live-pulse" : "text-white/40"
                )} 
              />
            </button>
          )}
        </div>
      </div>

      {/* Teams & Score Compact Layout */}
      <div className="flex items-center justify-between relative z-10 pl-1.5">
        <div className="flex flex-col gap-1.5 flex-1">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center p-0.5 shrink-0">
                <img src={match.homeTeamLogo || '/vite.svg'} alt={match.homeTeamName} className="w-4 h-4 object-contain" />
              </div>
              <span className="text-[11px] font-medium text-white/90 truncate max-w-[120px]">{match.homeTeamName}</span>
            </div>
            <div className={cn(
              "text-[12px] font-display font-bold w-6 text-center tabular-nums",
              isLive ? "text-brand-neon" : "text-white/80"
            )}>
              {match.status === 'UPCOMING' ? '-' : match.homeScore}
            </div>
          </div>
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center p-0.5 shrink-0">
                <img src={match.awayTeamLogo || '/vite.svg'} alt={match.awayTeamName} className="w-4 h-4 object-contain" />
              </div>
              <span className="text-[11px] font-medium text-white/90 truncate max-w-[120px]">{match.awayTeamName}</span>
            </div>
            <div className={cn(
              "text-[12px] font-display font-bold w-6 text-center tabular-nums",
              isLive ? "text-brand-neon" : "text-white/80"
            )}>
              {match.status === 'UPCOMING' ? '-' : match.awayScore}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
