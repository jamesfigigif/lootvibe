import React, { useState, useEffect } from 'react';
import { Battle, LootBox, User } from '../types';
import { INITIAL_BOXES } from '../constants';
import { supabase } from '../services/supabaseClient';
import { Swords, Users, Plus, Crown, ShieldCheck, Sword, Zap, Lock, LogIn, Skull, Eye } from 'lucide-react';

interface BattleLobbyProps {
  battles: Battle[];
  user: User | null;
  onJoin: (battleId: string) => void;
  onCreate: () => void;
  onWatch: (battle: Battle) => void;
}

export const BattleLobby: React.FC<BattleLobbyProps> = ({ battles = [], user, onJoin, onCreate, onWatch }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | '1v1' | '2v2' | '3v3'>('ALL');
  const [newBattleIds, setNewBattleIds] = useState<Set<string>>(new Set());

  // Track new battles for animation
  useEffect(() => {
    if (battles.length > 0) {
      const currentIds = new Set(battles.map(b => b.id));
      const previousIds = new Set(Array.from(newBattleIds));

      // Find newly added battles
      const added = battles.filter(b => !previousIds.has(b.id)).map(b => b.id);

      if (added.length > 0) {
        setNewBattleIds(currentIds);

        // Remove animation class after 1 second
        setTimeout(() => {
          setNewBattleIds(new Set());
        }, 1000);
      }
    }
  }, [battles.length]);

  // Periodically create random battles every 2-3 minutes
  useEffect(() => {
    const createRandomBattle = async () => {
      try {
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!anonKey) {
          console.error('VITE_SUPABASE_ANON_KEY is missing');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-random-battle', {
          headers: {
            Authorization: `Bearer ${anonKey}`
          }
        });

        if (error) {
          console.error('❌ Error creating random battle:', error);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
          return;
        }

        if (data && data.success) {
          console.log('✅ Random battle created:', data.battle?.id);
        } else if (data) {
          console.error('❌ Failed to create battle:', data);
        }
      } catch (error) {
        console.error('❌ Exception calling create-random-battle:', error);
      }
    };

    // Create a battle immediately on mount
    createRandomBattle();

    // Random interval between 2-3 minutes (120-180 seconds)
    const scheduleNext = () => {
      const randomDelay = (120 + Math.random() * 60) * 1000; // 2-3 minutes
      return setTimeout(() => {
        createRandomBattle();
        scheduleNext();
      }, randomDelay);
    };

    const timeout = scheduleNext();

    return () => clearTimeout(timeout);
  }, []);

  if (!battles) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Battles...</div>;

  const filteredBattles = battles.filter(b => {
      if (activeTab === 'ALL') return true;
      if (activeTab === '1v1') return b.playerCount === 2;
      if (activeTab === '2v2') return b.playerCount === 4;
      if (activeTab === '3v3') return b.playerCount === 6;
      return false;
  });

  // Stats Mock
  const activeVolume = filteredBattles.reduce((acc, b) => acc + (b.price * b.playerCount), 0);

  return (
    <div className="min-h-screen bg-[#0b0f19]">
      
      {/* Hero Header */}
      <div className="relative h-64 overflow-hidden border-b border-white/5 flex flex-col items-center justify-center bg-[#0d121f]">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center"></div>
         <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f19]/80 via-[#0b0f19]/50 to-[#0b0f19]"></div>
         
         <div className="relative z-10 flex flex-col items-center text-center px-4">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-widest mb-4 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> LIVE PVP ARENA
            </div>
            <h1 className="font-display text-4xl md:text-7xl font-bold text-white mb-2 tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.3)]">
               BATTLE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">ROYALE</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-lg hidden sm:block">
               Challenge other players. Winner takes all. Provably fair EOS-hash system.
            </p>
         </div>

         <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0b0f19] to-transparent"></div>
      </div>

      {/* Controls & Stats */}
      <div className="sticky top-20 z-30 bg-[#0b0f19]/95 backdrop-blur border-b border-white/5">
         <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex w-full md:w-auto items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-[#131b2e] p-1 rounded-lg border border-white/5 overflow-x-auto">
                {['ALL', '1v1', '2v2', '3v3'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`
                            px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all whitespace-nowrap
                            ${activeTab === tab ? 'bg-[#222c44] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        {tab}
                    </button>
                ))}
                </div>
                
                {/* Mobile Create Button */}
                 <button 
                    onClick={onCreate}
                    className="md:hidden bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 whitespace-nowrap"
                >
                    <Swords className="w-3 h-3" /> CREATE
                </button>
            </div>

            {/* Desktop Stats */}
            <div className="hidden md:flex items-center gap-8 text-xs font-mono text-slate-400">
                <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Active Battles</span>
                    <span className="text-white font-bold text-lg">{filteredBattles.length}</span>
                </div>
                <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Wager Volume</span>
                    <span className="text-emerald-400 font-bold text-lg">${activeVolume.toLocaleString()}</span>
                </div>
            </div>

            {/* Desktop Create Button */}
            <button 
                onClick={onCreate}
                className="hidden md:flex bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:scale-105"
            >
                <Swords className="w-4 h-4" /> CREATE BATTLE
            </button>
         </div>
      </div>

      {/* Battle Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredBattles.length === 0 ? (
                 <div className="col-span-full py-20 text-center text-slate-500">
                     <Swords className="w-12 h-12 mx-auto mb-4 opacity-20" />
                     <p>No active battles in this category.</p>
                     <button onClick={onCreate} className="text-red-400 hover:text-white mt-2 font-bold text-sm">Create One</button>
                 </div>
             ) : filteredBattles.map((battle) => {
                 const box = INITIAL_BOXES.find(b => b.id === battle.boxId);
                 if (!box) return null;

                 const isFull = battle.players.every(p => p !== null);
                 const isPlayerInBattle = user && battle.players.some(p => p?.id === user.id);
                 const isNew = newBattleIds.has(battle.id);

                 return (
                     <div key={battle.id} className={`group relative bg-[#131b2e] rounded-xl border overflow-hidden transition-all ${
                         battle.status === 'FINISHED'
                             ? 'border-red-500/30 opacity-75'
                             : 'border-white/5 hover:border-white/10'
                     } ${isNew ? 'animate-slideIn' : ''}`}>
                         <div className={`absolute inset-0 bg-gradient-to-br ${box.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                         <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         
                         <div className="p-5 relative z-10">
                             {/* Header */}
                             <div className="flex justify-between items-start mb-6">
                                 <div className="flex items-center gap-3">
                                     <div className="relative w-12 h-12">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${box.color} blur-lg opacity-40`}></div>
                                        <img src={box.image} loading="lazy" className="w-full h-full object-cover rounded-lg border border-white/10 relative z-10" />
                                     </div>
                                     <div>
                                         <div className="text-white font-bold leading-none mb-1">{box.name}</div>
                                         <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                                             <span className="font-bold">${battle.price}</span>
                                             <span className="text-slate-500">to join</span>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="flex flex-col items-end gap-1">
                                    {battle.status === 'FINISHED' && (
                                        <div className="px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase mb-1">
                                            Forfeited
                                        </div>
                                    )}
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                                        battle.status === 'FINISHED' 
                                            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                            : 'bg-black/40 border-white/5 text-slate-300'
                                    }`}>
                                        {battle.status === 'FINISHED' ? (
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                        )}
                                        <span>{`${battle.roundCount} Rounds`}</span>
                                    </div>
                                    {battle.roundCount > 1 && (
                                        <div className="text-[9px] text-yellow-500/80 font-bold uppercase">Last Round Only</div>
                                    )}
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">{battle.playerCount === 2 ? '1v1' : battle.playerCount === 4 ? '2v2' : '3v3'} Mode</div>
                                 </div>
                             </div>

                             {/* Battle Visual - Just showing Avatar counts */}
                             <div className="flex items-center justify-between gap-2 mb-6 bg-[#0b0f19] p-3 rounded-lg border border-white/5">
                                 <div className="flex items-center gap-[-8px]">
                                     {battle.players.slice(0, battle.playerCount / 2).map((p, i) => (
                                         <div key={i} className="w-8 h-8 rounded-full border-2 border-[#131b2e] bg-slate-800 -ml-2 first:ml-0 overflow-hidden relative z-10">
                                             {p ? <img src={p.avatar} loading="lazy" className="w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><Users className="w-3 h-3"/></div>}
                                         </div>
                                     ))}
                                 </div>

                                 <div className="font-display font-bold text-red-500 text-xs px-2">VS</div>

                                 <div className="flex items-center gap-[-8px] flex-row-reverse">
                                     {battle.players.slice(battle.playerCount / 2).map((p, i) => (
                                         <div key={i} className="w-8 h-8 rounded-full border-2 border-[#131b2e] bg-slate-800 -mr-2 first:mr-0 overflow-hidden relative z-10">
                                              {p ? <img src={p.avatar} loading="lazy" className="w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 opacity-50"><Plus className="w-3 h-3"/></div>}
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             {/* Footer Action */}
                             {isPlayerInBattle && battle.status === 'WAITING' ? (
                                <button onClick={() => onWatch(battle)} className="w-full py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-sm hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                                    <LogIn className="w-4 h-4" /> REJOIN BATTLE
                                </button>
                             ) : isPlayerInBattle && battle.status === 'ACTIVE' ? (
                                <button disabled className="w-full py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                                    <Lock className="w-4 h-4" /> FORFEITED
                                </button>
                             ) : isPlayerInBattle && battle.status === 'FINISHED' ? (
                                <button onClick={() => onWatch(battle)} className="w-full py-3 rounded-lg bg-slate-500/10 border border-slate-500/30 text-slate-400 font-bold text-sm hover:bg-slate-500/20 transition-colors flex items-center justify-center gap-2">
                                    <Eye className="w-4 h-4" /> VIEW RESULTS
                                </button>
                             ) : battle.status === 'ACTIVE' ? (
                                 <button onClick={() => onWatch(battle)} className="w-full py-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                     <Zap className="w-4 h-4" /> WATCH BATTLE
                                 </button>
                             ) : battle.status === 'FINISHED' ? (
                                 <button disabled className="w-full py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 opacity-60">
                                     <Lock className="w-4 h-4" /> FORFEITED
                                 </button>
                             ) : isFull ? (
                                <button disabled className="w-full py-3 rounded-lg bg-white/5 border border-white/5 text-slate-500 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                                     <Lock className="w-4 h-4" /> LOBBY FULL
                                </button>
                             ) : (
                                 <button onClick={() => onJoin(battle.id)} className="w-full py-3 rounded-lg bg-white text-black font-bold text-sm hover:bg-slate-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2">
                                     <Sword className="w-4 h-4" /> JOIN FOR ${battle.price}
                                 </button>
                             )}
                         </div>
                     </div>
                 );
             })}
         </div>
      </div>
    </div>
  );
};