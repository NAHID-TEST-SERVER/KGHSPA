import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Radio, Calendar, LayoutDashboard, Search, Bell, X } from 'lucide-react';
import { useAuthStore, useUiStore, Toast, useStore } from './store';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { cn } from './lib/utils';

import HomePage from './pages/HomePage';
import MatchPage from './pages/MatchPage';
import AdminPage from './pages/AdminPage';
import TeamPage from './pages/TeamPage';
import { Notification, Match } from './types';

function ToastContainer() {
  const { toasts, removeToast } = useUiStore();
  
  return (
    <div className="fixed top-2 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((t) => (
        <div key={t.id} className={cn(
          "pointer-events-auto flex items-center justify-between p-2.5 rounded-full shadow-lg backdrop-blur-xl border w-full max-w-sm animate-in slide-in-from-top-4 fade-in duration-300",
          t.type === 'goal' ? "bg-brand-neon/10 border-brand-neon shadow-[0_0_15px_rgba(0,255,102,0.15)] text-brand-neon" : 
          t.type === 'error' ? "bg-brand-red/10 border-brand-red text-brand-red" : 
          "bg-[#0A0A0C]/90 border-white/10 text-white"
        )}>
          <div className="flex items-center gap-2 overflow-hidden flex-1 pl-2">
             {t.type === 'goal' && <div className="w-1.5 h-1.5 rounded-full bg-brand-neon live-pulse shrink-0" />}
             <div className="flex flex-col truncate">
               {t.title && <h4 className="font-bold text-[10px] tracking-widest uppercase">{t.title}</h4>}
               <p className="text-[11px] font-medium opacity-90 truncate">{t.message}</p>
             </div>
          </div>
          <button onClick={() => removeToast(t.id)} className="p-1.5 hover:bg-white/10 rounded-full shrink-0 ml-2">
            <X size={12} className="opacity-50" />
          </button>
        </div>
      ))}
    </div>
  );
}

function TopNav() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { notifications, unreadIds, clearUnreadIds, matches } = useStore();

  return (
    <header className="sticky top-0 z-50 bg-[#05060A]/90 backdrop-blur-md border-b border-white/5 pl-[18px] pr-[19px] pt-[15px] pb-[8px] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-neon to-brand-accent rounded-lg flex items-center justify-center text-[#ff0000]">
          <span className="font-display text-black font-bold text-lg leading-none">K</span>
        </div>
        <span className="font-display font-bold text-[12px] tracking-tight uppercase">KGHS <span className="text-brand-neon">SPORTS</span></span>
      </div>
      <div className="flex items-center gap-4 relative">
        <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <Search size={20} className="text-gray-400" />
        </button>
        <button onClick={() => { setShowDropdown(!showDropdown); clearUnreadIds(); }} className="p-2 rounded-full hover:bg-white/5 transition-colors relative">
          {unreadIds.size > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full live-pulse"></span>}
          <Bell size={20} className={unreadIds.size > 0 ? "text-brand-neon" : "text-gray-400"} />
        </button>
        
        {/* Notification Dropdown */}
        {showDropdown && (
          <div className="absolute top-12 right-0 w-80 bg-[#05060A] border border-white/10 rounded-2xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase text-white/50 mb-3">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-xs text-center text-white/30 py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n: Notification) => (
                  <div key={n.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <h4 className="font-bold text-xs uppercase tracking-wide text-brand-neon mb-1">{n.title}</h4>
                    <p className="text-sm opacity-90">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  const { isAdmin } = useAuthStore();
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/live', label: 'Live', icon: Radio },
    { path: '/fixtures', label: 'Fixtures', icon: Calendar },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#05060A]/95 backdrop-blur-xl border-t border-white/5 pb-safe pb-0">
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-brand-neon' : 'text-brand-text-muted hover:text-white opacity-50 hover:opacity-100'}`}
            >
              <item.icon size={24} className={`mb-0 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AppContent() {
  const { setIsAdmin, setIsLoading } = useAuthStore();
  const location = useLocation();
  const { addToast } = useUiStore();
  const { setNotifications, addUnreadId, setMatches } = useStore();

  useEffect(() => {
    const qMatches = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
    const unsubMatches = onSnapshot(qMatches, (snapshot) => {
      const liveMatches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];
      setMatches(liveMatches);
    }, (error) => {
      console.error('Error fetching global matches:', error);
    });

    return () => unsubMatches();
  }, [setMatches]);

  useEffect(() => {
    // Listen to recent notifications globally
    const q = query(
      collection(db, 'notifications'), 
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
    
    // We want to toast only new ones that arrive while we are on the page.
    let initialLoad = true;
    
    const unsub = onSnapshot(q, (snap) => {
      const newSt = snap.docs.map(d => ({id: d.id, ...d.data()}) as Notification);
      setNotifications(newSt);
      
      if (!initialLoad) {
        snap.docChanges().forEach(change => {
           if (change.type === 'added') {
              const notif = { id: change.doc.id, ...change.doc.data() } as Notification;
              addUnreadId(notif.id);
              addToast({
                title: notif.title,
                message: notif.message,
                type: notif.type === 'goal' ? 'goal' : 'info'
              });
           }
        });
      }
      initialLoad = false;
    });
    return () => unsub();
  }, [addToast, setNotifications, addUnreadId]);

  useEffect(() => {
    if (localStorage.getItem('admin_passcode') === '51535759') {
      setIsAdmin(true);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      (window as any).currentUser = user;
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          setIsAdmin(adminDoc.exists() || user.email === 'islammdnahidul407@gmail.com');
        } catch (e) {
          setIsAdmin(user.email === 'islammdnahidul407@gmail.com');
        }
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [setIsAdmin, setIsLoading]);

  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      <ToastContainer />
      {!isAdminPage && <TopNav />}
      <main className="flex-1 flex flex-col pb-24 text-[#e1e1e1] border-[#f9f9f9]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/live" element={<HomePage filter="LIVE" />} />
          <Route path="/fixtures" element={<HomePage filter="UPCOMING" />} />
          <Route path="/match/:id" element={<MatchPage />} />
          <Route path="/team/:id" element={<TeamPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      {!isAdminPage && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
