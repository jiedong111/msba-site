import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, Brain, Home } from 'lucide-react';
import Aurora from './ui/Aurora';
import GlassPanel from './ui/GlassPanel';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/csv-analysis', label: 'CSV Analysis', icon: BarChart3 },
    { path: '/sentiment-analysis', label: 'Sentiment Analysis', icon: Brain },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: 'black'
    }}>
      {/* Aurora Background - fills entire viewport */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        <Aurora />
      </div>
      
      {/* Content Layer - above background */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh'
      }}>
        {/* Navigation */}
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '1.5rem'
        }}>
          <GlassPanel className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">M</span>
                </div>
                <div>
                  <h1 className="text-lg font-medium text-gray-100">Dashboard</h1>
                </div>
              </Link>
              
              <div className="flex items-center space-x-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                      location.pathname === path
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </GlassPanel>
        </nav>

        {/* Main Content */}
        <main style={{ position: 'relative' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}