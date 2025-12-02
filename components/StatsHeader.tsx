import React from 'react';
import { Box, DollarSign, Activity, Gift } from 'lucide-react';

export const StatsHeader = () => {
  return (
    <div className="hidden lg:flex w-full bg-[#0d111c] border-b border-white/5 h-12 items-center justify-center gap-12 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-white font-bold tracking-wider">LIVE</span>
        </div>
        
        <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            <span>Last Block: <span className="text-slate-200 font-mono">#867543</span></span>
        </div>

        <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Total Won Today: <span className="text-emerald-400 font-mono font-bold">$47,941.66</span></span>
        </div>

        <div className="flex items-center gap-2">
            <Box className="w-3.5 h-3.5 text-blue-500" />
            <span>Boxes Opened: <span className="text-slate-200 font-mono">1,248</span></span>
        </div>

        <div className="flex items-center gap-2">
            <Gift className="w-3.5 h-3.5 text-yellow-500" />
            <span>Biggest Win: <span className="text-yellow-400 font-bold">Rolex Submariner ($8,500)</span></span>
        </div>
    </div>
  );
};
