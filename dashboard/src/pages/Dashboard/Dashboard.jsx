import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Activity, Globe, Lock, LogOut, RefreshCw } from 'lucide-react';
import './Dashboard.css';

const API_BASE = "https://phishing-sentinel.onrender.com";

function Dashboard() {
  const [stats, setStats] = useState({ scanned: 0, threatsBlocked: 0, trustScore: 100 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('sentinel_token');
    navigate('/login');
  };

  const fetchData = async () => {
    const token = localStorage.getItem('sentinel_token');
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/api/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/logs`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.status === 401 || logsRes.status === 401) {
        handleLogout(); // Token expired or invalid
        return;
      }

      if (!statsRes.ok || !logsRes.ok) throw new Error("API Connection Failed");

      setStats(await statsRes.json());
      setRecentEvents(await logsRes.json());
      setError(null);
    } catch (err) {
      setError("Sentinel API is offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-8">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={() => {setLoading(true); fetchData();}} className="px-6 py-2 bg-cyan-600 rounded-lg flex items-center gap-2 hover:bg-cyan-500 transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <img src="/assets/phishingSentinelLogo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-3xl font-bold tracking-tight">SENTINEL <span className="text-cyan-400">HUB</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Terminate Session
          </button>
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2">
            <Activity className={`w-4 h-4 ${loading ? 'text-slate-500 animate-spin' : 'text-cyan-400'}`} />
            <span className="text-sm font-medium">{loading ? 'Syncing...' : 'System Live'}</span>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Pages Scanned" value={stats.scanned} icon={<Globe className="text-blue-400" />} />
        <StatCard title="Threats Neutralized" value={stats.threatsBlocked} icon={<AlertTriangle className="text-red-400" />} />
        <StatCard title="Security Trust Score" value={`${Math.round(stats.trustScore)}%`} icon={<Lock className="text-green-400" />} />
      </div>

      {/* Real-Time Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Real-Time Observation Log</h2>
          <span className="text-xs font-mono text-slate-500">POLLING ACTIVE</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Target URL</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Threat Level</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentEvents?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No scan data received yet.</td>
                </tr>
              ) : (
                recentEvents?.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-300 max-w-md truncate">{event.url}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-2 text-sm font-medium ${!event.is_spoof ? 'text-green-400' : 'text-red-400'}`}>
                        {!event.is_spoof ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {!event.is_spoof ? 'Legitimate' : 'Phishing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{(event.confidence_score).toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        event.threat_level === 'high' ? 'bg-red-400/10 text-red-400' : 
                        event.threat_level === 'medium' ? 'bg-orange-400/10 text-orange-400' : 'bg-green-400/10 text-green-400'
                      }`}>{event.threat_level}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(event.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-3 bg-slate-950 rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
      {React.cloneElement(icon, { size: 100 })}
    </div>
  </div>
);

export default Dashboard;