import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { SignInButton } from '../components/ClerkAuthWrapper';
import { Wallet, LogOut, Package, UserCircle2, Settings, Bell, Menu, X, Trophy, Users, Shield, ChevronDown, EyeOff } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { getUnreadCount } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

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
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogin, onLogout, onDeposit, onWithdraw, onHome, onProfile, onBattles, onRaces, onAffiliates, onAdmin }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [displayedBalance, setDisplayedBalance] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  // Balance visibility state
  const [showBalance, setShowBalance] = useState(false);
  const [isMobileBalanceOpen, setIsMobileBalanceOpen] = useState(false);

  // Animate balance changes
  React.useEffect(() => {
    if (!user) {
      setDisplayedBalance(0);
      return;
    }

    const targetBalance = user.balance;
    const startBalance = displayedBalance;
    const diff = targetBalance - startBalance;

    if (Math.abs(diff) < 0.01) {
      setDisplayedBalance(targetBalance);
      return;
    }

    const duration = 1000; // 1 second animation
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const current = startBalance + (diff * ease);
      setDisplayedBalance(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [user?.balance]);

  // Fetch unread notification count and set up real-time subscription
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let debounceTimer: NodeJS.Timeout;
    const debouncedFetchCount = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          const count = await getUnreadCount(user.id);
          setUnreadCount(count);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      }, 15000); // Debounce by 15 seconds to reduce polling frequency
    };

    // Initial fetch
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription for new notifications (with longer debounce)
    const channel = supabase
      .channel('navbar-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Debounced refresh when new notification arrives (15 seconds)
          debouncedFetchCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Debounced refresh when notification is marked as read (15 seconds)
          debouncedFetchCount();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user]);

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
      {user?.role === 'admin' && (
        <button onClick={() => { onAdmin(); setIsMobileMenuOpen(false); }} className="hover:text-white transition-colors text-red-400 text-left flex items-center gap-2">
          <Shield className="w-4 h-4" /> ADMIN
        </button>
      )}
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
            <span className="hidden md:block text-[10px] text-slate-400 font-mono tracking-widest uppercase">Provably Fair</span>
          </div>
        </div>

        {/* Center Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
          <NavLinks />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4 z-50">
          {user ? (
            <>
              {/* Mobile Wallet Display with Dropdown */}
              {/* Mobile Wallet Display with Dropdown */}
              <div className="relative md:hidden group flex items-center gap-2">
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBalance(!showBalance);
                  }}
                  className="p-2 bg-white/5 rounded-lg text-emerald-400 hover:bg-white/10 active:scale-95 transition-all"
                  aria-label={showBalance ? "Hide Balance" : "Show Balance"}
                >
                  {showBalance ? <EyeOff className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                </button>

                {/* Balance & Menu Toggle */}
                <button
                  onClick={() => setIsMobileBalanceOpen(!isMobileBalanceOpen)}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-900/40 to-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:border-emerald-500/50 active:scale-95 transition-all"
                >
                  <span className="font-mono font-bold text-emerald-400 text-sm min-w-[60px] text-right">
                    {showBalance ? `$${displayedBalance.toFixed(2)}` : '****'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-emerald-400/60 transition-transform ${isMobileBalanceOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile Balance Dropdown */}
                {isMobileBalanceOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#131b2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={() => {
                        onDeposit();
                        setIsMobileBalanceOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-3 border-b border-white/5 active:bg-emerald-500/20"
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="font-medium">Deposit</span>
                    </button>
                    <button
                      onClick={() => {
                        onWithdraw();
                        setIsMobileBalanceOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-3 active:bg-purple-500/20"
                    >
                      <LogOut className="w-4 h-4 rotate-180" />
                      <span className="font-medium">Withdraw</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowBalance(!showBalance)}
                className="hidden md:flex items-center gap-3 bg-gradient-to-r from-emerald-900/40 to-emerald-950/40 border border-emerald-500/20 px-4 py-2 rounded-lg hover:border-emerald-500/50 transition-all group relative"
              >
                <div className="bg-emerald-500/20 p-1 rounded">
                  {showBalance ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Wallet className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="flex flex-col items-start leading-none min-w-[80px]">
                  <span className="text-[10px] text-emerald-500/80 font-bold uppercase">Balance</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {showBalance ? `$${displayedBalance.toFixed(2)}` : '****'}
                  </span>
                </div>
                <div
                  className="w-6 h-6 rounded bg-emerald-500 text-black flex items-center justify-center font-bold text-xs group-hover:bg-white transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeposit();
                  }}
                >+</div>
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

              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative text-slate-400 hover:text-white transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotificationOpen && user ? (
                  <NotificationDropdown
                    user={user}
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                ) : isNotificationOpen && !user ? (
                  <div className="fixed sm:absolute top-20 right-4 sm:right-0 w-[calc(100vw-2rem)] sm:w-96 bg-[#131b2e] border border-white/10 rounded-xl shadow-2xl z-50 p-4">
                    <p className="text-sm text-slate-400">Please wait, loading user...</p>
                  </div>
                ) : null}
              </div>

              <div className="relative group">
                <button
                  onClick={onProfile}
                  className="flex items-center gap-3 pl-2 pr-1 py-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="flex flex-col items-end hidden md:flex">
                    <span className="font-bold text-sm text-white">{user.username}</span>
                    <span className="text-[10px] text-slate-400">Level 42</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 overflow-hidden shadow-lg shadow-purple-900/20">
                    <img src={user.avatar} alt={user.username} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#131b2e] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
                  <button
                    onClick={onProfile}
                    className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5"
                  >
                    <UserCircle2 className="w-4 h-4 text-purple-400" />
                    <span className="font-medium">Profile</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
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
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              if (!isMobileMenuOpen) {
                setIsNotificationOpen(false); // Close notification dropdown when opening mobile menu
              }
            }}
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
              <>
                <div className="h-px bg-white/10 my-2"></div>
                <button
                  onClick={() => {
                    onProfile();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-2 py-2 text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <UserCircle2 className="w-5 h-5 text-purple-400" />
                  <span className="font-bold">Profile</span>
                  <span className="text-xs text-slate-400 ml-auto bg-white/5 px-2 py-0.5 rounded">{user.username}</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-2 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-bold">Sign Out</span>
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
};