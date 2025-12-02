import React from 'react';
import { Trophy, Timer, Crown, Medal, TrendingUp } from 'lucide-react';

// Updated Mock Data with realistic High-Roller volumes for a $15,000 prize
const MOCK_LEADERBOARD = [
  { rank: 1, user: 'J*B', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JB', wagered: 452420.27, prize: 6000 },
  { rank: 2, user: 'U*4', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=U4', wagered: 310902.28, prize: 3500 },
  { rank: 3, user: 'C*T', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CT', wagered: 243612.63, prize: 2000 },
  { rank: 4, user: 'J*T', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JT', wagered: 195000.00, prize: 1500 },
  { rank: 5, user: 'F*O', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FO', wagered: 117402.02, prize: 1000 },
  { rank: 6, user: 'A*L', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AL', wagered: 83394.94, prize: 500 },
  { rank: 7, user: 'M*K', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MK', wagered: 54512.12, prize: 200 },
  { rank: 8, user: 'S*R', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SR', wagered: 27289.89, prize: 150 },
  { rank: 9, user: 'D*W', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DW', wagered: 15033.33, prize: 100 },
  { rank: 10, user: 'R*P', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RP', wagered: 8235.55, prize: 50 },
];

export const RacePage = () => {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
        
        {/* Race Headers (Daily / Weekly) */}
        <div className="bg-[#131b2e] border-b border-white/5">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2">
                
                {/* Daily Race */}
                <div className="p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="text-emerald-400 font-bold tracking-widest text-xs uppercase mb-2 flex items-center gap-2">
                            <Trophy className="w-4 h-4" /> Daily Race
                        </div>
                        <div className="font-display font-bold text-4xl mb-2">$150.00</div>
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                            <Timer className="w-4 h-4" />
                            <span>ENDS IN</span>
                            <span className="text-white font-bold">08H : 43M : 33S</span>
                        </div>
                    </div>
                </div>

                {/* Weekly Race */}
                <div className="p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="text-purple-400 font-bold tracking-widest text-xs uppercase mb-2 flex items-center gap-2">
                            <Crown className="w-4 h-4" /> Weekly Race
                        </div>
                        <div className="font-display font-bold text-4xl mb-2">$15,000.00</div>
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                             <Timer className="w-4 h-4" />
                            <span>ENDS IN</span>
                            <span className="text-white font-bold">06D : 08H : 43M : 33S</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Podium Section */}
        <div className="relative py-12 md:py-20 overflow-hidden">
             {/* Background Glows */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

             <div className="max-w-4xl mx-auto px-4 flex items-end justify-center gap-4 md:gap-8 h-[400px] relative">
                
                {/* 2nd Place */}
                <div className="flex flex-col items-center relative group">
                    <div className="mb-4 flex flex-col items-center animate-float" style={{ animationDelay: '1s' }}>
                        <div className="text-emerald-400 font-bold font-mono mb-1 text-lg">${MOCK_LEADERBOARD[1].prize.toLocaleString()}</div>
                        <img src={MOCK_LEADERBOARD[1].avatar} className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.3)] bg-[#131b2e]" />
                        <div className="mt-2 font-bold text-slate-300">{MOCK_LEADERBOARD[1].user}</div>
                        <div className="text-xs text-slate-500 font-mono">${(MOCK_LEADERBOARD[1].wagered).toLocaleString()}</div>
                    </div>
                    <div className="w-24 md:w-32 h-32 md:h-40 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-lg border-t-4 border-slate-400 relative flex items-center justify-center shadow-2xl">
                        <span className="text-6xl font-display font-bold text-slate-500/30">2</span>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center relative z-10 group">
                    {/* Fixed Crown Position: added absolute positioning with negative top value */}
                    <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                        <Crown className="w-12 h-12 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" fill="currentColor" />
                    </div>
                    <div className="mb-4 flex flex-col items-center animate-float">
                        <div className="text-emerald-400 font-bold font-mono mb-1 text-xl">${MOCK_LEADERBOARD[0].prize.toLocaleString()}</div>
                        <img src={MOCK_LEADERBOARD[0].avatar} className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.4)] bg-[#131b2e]" />
                        <div className="mt-2 font-bold text-yellow-400 text-lg">{MOCK_LEADERBOARD[0].user}</div>
                        <div className="text-xs text-slate-500 font-mono">${(MOCK_LEADERBOARD[0].wagered).toLocaleString()}</div>
                    </div>
                    <div className="w-28 md:w-40 h-44 md:h-56 bg-gradient-to-b from-yellow-600 to-yellow-900 rounded-t-lg border-t-4 border-yellow-400 relative flex items-center justify-center shadow-2xl">
                         <div className="absolute inset-0 bg-yellow-400/10 animate-pulse"></div>
                         <span className="text-7xl font-display font-bold text-yellow-900/40">1</span>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center relative group">
                    <div className="mb-4 flex flex-col items-center animate-float" style={{ animationDelay: '2s' }}>
                        <div className="text-emerald-400 font-bold font-mono mb-1 text-lg">${MOCK_LEADERBOARD[2].prize.toLocaleString()}</div>
                        <img src={MOCK_LEADERBOARD[2].avatar} className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-orange-700 shadow-[0_0_20px_rgba(194,65,12,0.3)] bg-[#131b2e]" />
                        <div className="mt-2 font-bold text-orange-400">{MOCK_LEADERBOARD[2].user}</div>
                        <div className="text-xs text-slate-500 font-mono">${(MOCK_LEADERBOARD[2].wagered).toLocaleString()}</div>
                    </div>
                    <div className="w-24 md:w-32 h-24 md:h-32 bg-gradient-to-b from-orange-800 to-orange-950 rounded-t-lg border-t-4 border-orange-700 relative flex items-center justify-center shadow-2xl">
                        <span className="text-6xl font-display font-bold text-orange-900/40">3</span>
                    </div>
                </div>

             </div>
        </div>

        {/* List Section */}
        <div className="max-w-4xl mx-auto px-4 pb-20">
            <div className="bg-[#131b2e] rounded-xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-500 border-b border-white/5 uppercase tracking-wider">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-5 md:col-span-4">Player</div>
                    <div className="col-span-3 md:col-span-4 text-right">Wagered</div>
                    <div className="col-span-3 text-right">Prize</div>
                </div>
                
                {MOCK_LEADERBOARD.slice(3).map((player, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors">
                        <div className="col-span-1 text-center font-display font-bold text-slate-400">{player.rank}th</div>
                        <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden">
                                <img src={player.avatar} className="w-full h-full" />
                            </div>
                            <span className="font-bold">{player.user}</span>
                        </div>
                        <div className="col-span-3 md:col-span-4 text-right font-mono text-slate-300">
                            <span className="text-slate-500 text-[10px] mr-1">UNBOXED</span>
                            ${player.wagered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="col-span-3 text-right font-mono font-bold text-emerald-400">
                            ${player.prize.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>

    </div>
  );
};