import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../services/supabaseClient';

interface Drop {
   id: string;
   user_name: string;
   item_name: string;
   item_image: string;
   box_name: string;
   value: number;
   created_at: string;
}

export const LiveDrops: React.FC = () => {
   const [drops, setDrops] = useState<Drop[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      // Start with empty drops (removed all old mock data)
      setDrops([]);
      setLoading(false);

      // Subscribe to new drops
      const subscription = supabase
         .channel('live_drops_admin_channel')
         .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_drops' }, (payload) => {
            const newDrop = payload.new as Drop;
            setDrops(prev => [newDrop, ...prev].slice(0, 10));
         })
         .subscribe();

      return () => {
         subscription.unsubscribe();
      };
   }, []);

   return (
      <div className="p-4 bg-[#131b2e] border border-white/10 rounded-xl mt-4">
         <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Live Drops
         </h2>
         {loading ? (
            <p className="text-slate-400">Loading…</p>
         ) : (
            <ul className="space-y-3">
               {drops.map(d => (
                  <li key={d.id} className="flex items-center gap-3">
                     <img src={d.item_image} alt={d.item_name} className="w-10 h-10 rounded object-cover" />
                     <div className="flex-1">
                        <p className="text-sm text-white">
                           <span className="font-medium">{d.user_name}</span> just won{' '}
                           <span className="font-medium">{d.item_name}</span>
                        </p>
                        <p className="text-xs text-slate-400">
                           {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                        </p>
                     </div>
                     <div className="text-sm font-bold text-purple-400">${d.value}</div>
                  </li>
               ))}
            </ul>
         )}
      </div>
   );
};
