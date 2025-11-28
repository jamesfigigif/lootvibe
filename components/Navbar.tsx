import React, { useState } from 'react';
import { User } from '../types';
import { SignInButton } from '../components/ClerkAuthWrapper';
import { Wallet, LogOut, Package, UserCircle2, Settings, Bell, Menu, X, Trophy, Users } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onHome: () => void;
  onProfile: () => void;
  onBattles: () => void;
  onRaces: () => void;
  onAffiliates: () => void;
  onAdmin: () => void;
  balanceIncrease?: number | null; // Amount to show in animation
  onBalanceAnimationComplete?: () => void; // Callback when animation finishes
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogin, onLogout, onDeposit, onWithdraw, onHome, onProfile, onBattles, onRaces, onAffiliates, onAdmin, balanceIncrease, onBalanceAnimationComplete }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBalancePopup, setShowBalancePopup] = useState(false);

  // Trigger animation when balanceIncrease changes
  React.useEffect(() => {
    if (balanceIncrease && balanceIncrease > 0) {
      setShowBalancePopup(true);
      const timer = setTimeout(() => {
        setShowBalancePopup(false);
        onBalanceAnimationComplete?.();
      }, 2000); // Animation lasts 2 seconds
      return () => clearTimeout(timer);
    }
  }, [balanceIncrease, onBalanceAnimationComplete]);

  const NavLinks = () => (
    <>
      <button onClick={() => { onHome(); setIsMobileMenuOpen(false); }} className="hover:text-white transition-colors text-left">BOXES</button>
      <button onClick={() => { onBattles(); setIsMobileMenuOpen(false); }} className="hover:text-white transition-colors text-left">BATTLES</button>
      <button onClick={() => { onRaces(); setIsMobileMenuOpen(false); }} className="hover:text-white transition-colors text-left flex items-center gap-2">
        RACE <span className="bg-yellow-500 text-black text-[9px] px-1.5 rounded font-bold animate-pulse">LIVE</span>
      </button>
      <button onClick={() => { onAffiliates(); setIsMobileMenuOpen(false); }} className="hover:text-white transition-colors text-purple-400 text-left flex items-center gap-2">
        <Users className="w-4 h-4" /> AFFILIATES
      </button>
    </>
  );

  return (
    <>
      <style>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -60px);
          }
        }
      `}</style>
      <nav className="fixed top-0 left-0 right-0 h-20 bg-[#0b0f19]/90 backdrop-blur-xl border-b border-white/5 z-50 px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer group z-50" onClick={onHome}>
          <div className="relative">
            <div className="absolute inset-0 bg-purple-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <Package className="relative z-10 text-white w-8 h-8" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-2xl tracking-tighter text-white leading-none">
              LOOT<span className="text-purple-500">VIBE</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Provably Fair</span>
          </div>
        </div>

        {/* Center Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
          <NavLinks />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 z-50">
          {user ? (
            <>
              <button
                onClick={onDeposit}
                className="hidden md:flex items-center gap-3 bg-gradient-to-r from-emerald-900/40 to-emerald-950/40 border border-emerald-500/20 px-4 py-2 rounded-lg hover:border-emerald-500/50 transition-all group relative"
              >
                {/* Animated +$ Popup */}
                {showBalancePopup && balanceIncrease && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-[float-up_2s_ease-out_forwards] pointer-events-none">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-400 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg shadow-emerald-500/50">
                      +${balanceIncrease.toFixed(2)}
                    </div>
                  </div>
                )}

                <div className="bg-emerald-500/20 p-1 rounded">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-emerald-500/80 font-bold uppercase">Balance</span>
                  <span className="font-mono font-bold text-emerald-400">${user.balance.toFixed(2)}</span>
                </div>
                <div className="w-6 h-6 rounded bg-emerald-500 text-black flex items-center justify-center font-bold text-xs group-hover:bg-white transition-colors">+</div>
              </button>

              <button
                onClick={onWithdraw}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-900/40 to-purple-950/40 border border-purple-500/20 px-4 py-2 rounded-lg hover:border-purple-500/50 transition-all group"
              >
                <div className="bg-purple-500/20 p-1 rounded">
                  <Wallet className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm font-bold text-purple-400">WITHDRAW</span>
              </button>

              <button className="relative text-slate-400 hover:text-white transition-colors hidden sm:block">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative group">
                <button onClick={onProfile} className="flex items-center gap-3 pl-2 pr-1 py-1 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex flex-col items-end hidden md:flex">
                    <span className="font-bold text-sm text-white">{user.username}</span>
                    <span className="text-[10px] text-slate-400">Level 42</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 overflow-hidden shadow-lg shadow-purple-900/20">
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  </div>
                </button>
              </div>
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="hidden sm:block bg-white text-black hover:bg-slate-200 px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                SIGN IN
              </button>
            </SignInButton>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-[#0b0f19] border-b border-white/10 p-4 flex flex-col gap-4 lg:hidden animate-in slide-in-from-top-5">
            <NavLinks />
            {!user && (
              <SignInButton mode="modal">
                <button onClick={() => setIsMobileMenuOpen(false)} className="bg-white text-black py-3 rounded-lg font-bold text-center">SIGN IN</button>
              </SignInButton>
            )}
            {user && (
              <button onClick={() => { onDeposit(); setIsMobileMenuOpen(false); }} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-3 rounded-lg font-bold text-center">
                DEPOSIT FUNDS (${user.balance.toFixed(2)})
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
};