import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { 
  LayoutDashboard, Smile, BookOpen, BarChart3, Heart, 
  Settings, LogOut, Menu, X, Bell, ShieldAlert, Check
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Mood Tracker', href: '/mood', icon: Smile },
    { name: 'Journal NLP', href: '/journal', icon: BookOpen },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'AI Recommendations', href: '/recommendations', icon: Heart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex bg-darkBg text-slate-100 font-sans">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 glass-panel m-4 mr-0 p-4 border-slate-800">
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="bg-primary bg-opacity-20 p-2 rounded-xl border border-primary border-opacity-40">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              MINDSHIELD
            </h1>
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-widest">Student AI</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary to-indigo-700 text-white shadow-lg shadow-indigo-900/30' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
              {user?.email?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-200">{user?.email}</p>
              <p className="text-xs text-slate-500 font-medium">Student Account</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex w-full items-center gap-3 px-4 py-3 text-danger bg-danger/10 border border-danger/10 hover:bg-danger/20 rounded-xl font-semibold transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 py-4 lg:py-6 border-b border-slate-900 bg-darkBg/60 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800/40 rounded-xl"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="hidden md:block font-bold text-xl text-slate-200">
              {navigation.find(item => item.href === location.pathname)?.name || 'Wellness Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2.5 text-slate-400 hover:text-white bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center border-2 border-darkBg animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 glass-panel-active p-2 shadow-2xl border-slate-700/80 z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                    <p className="font-bold text-sm text-slate-300">Notifications</p>
                    {unreadCount > 0 && <span className="text-[10px] bg-danger/25 text-red-400 px-2 py-0.5 rounded-full font-semibold">{unreadCount} active</span>}
                  </div>
                  <div className="max-h-60 overflow-y-auto mt-2 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3 rounded-lg text-xs leading-relaxed transition-all duration-200 ${
                            notif.read ? 'opacity-55' : 'bg-slate-800/35 hover:bg-slate-850 border border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-bold ${notif.type === 'burnout_alert' ? 'text-red-400' : 'text-primary'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <button 
                                onClick={() => handleMarkRead(notif.id)}
                                className="text-slate-400 hover:text-secondary hover:bg-slate-700 p-0.5 rounded transition-all"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-slate-400 mt-1">{notif.message}</p>
                          <p className="text-[10px] text-slate-600 mt-1.5">{new Date(notif.created_at).toLocaleTimeString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile widget */}
            <div className="flex items-center gap-3 bg-slate-800/30 border border-slate-800 px-4 py-1.5 rounded-xl">
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'S'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-300 truncate max-w-[120px]">{user?.email?.split('@')[0]}</span>
            </div>
          </div>
        </header>

        {/* Content Frame */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
        />
      )}

      {/* Mobile Drawer Menu */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-64 bg-darkBg border-r border-slate-900 p-5 flex flex-col z-50 transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between py-2 mb-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <h1 className="font-bold text-lg tracking-wider">MINDSHIELD</h1>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary to-indigo-700 text-white shadow-lg shadow-indigo-900/30' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 pt-4 mt-auto">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex w-full items-center gap-3 px-4 py-3 text-danger bg-danger/10 hover:bg-danger/20 rounded-xl font-semibold transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

    </div>
  );
};

export default DashboardLayout;
