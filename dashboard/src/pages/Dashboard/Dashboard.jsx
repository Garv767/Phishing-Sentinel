import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, ExternalLink } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import CONFIG from '../../config';

const API_BASE = CONFIG.API_BASE_URL;
const SENTINEL_EXT_ID = "ankdnkinpgjkncgjphbjdpjaallligim";

function Dashboard() {
  const [stats, setStats] = useState({ scanned: 0, threatsBlocked: 0, trustScore: 100 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('sentinel_token');
    const doNavigate = () => navigate('/login');

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      const fallback = setTimeout(doNavigate, 300);
      chrome.runtime.sendMessage(SENTINEL_EXT_ID, { type: "LOGOUT" }, (response) => {
        clearTimeout(fallback);
        doNavigate();
      });
    } else {
      doNavigate();
    }
  };

  const fetchData = async () => {
    const token = localStorage.getItem('sentinel_token');
    try {
      /**
       * Primary telemetry polling loop
       * Retrieves global dashboard statistics and recent security logs
       */
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/api/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/logs`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.status === 401 || logsRes.status === 401) {
        handleLogout(); 
        return;
      }

      if (!statsRes.ok || !logsRes.ok) throw new Error("API Connection Failed");

      setStats(await statsRes.json());
      setRecentEvents(await logsRes.json());
      setError(null);
    } catch (err) {
      setError({
        code: 'ERR_NET_001',
        message: 'Sentinel Intelligence Network is offline.'
      });
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
    const REPO_URL = "https://github.com/Garv767/Phishing-Sentinel/blob/main/ERRORS.md";
    return (
      <div className="min-h-screen bg-white text-black dark:bg-[#050505] dark:text-white flex flex-col items-center justify-center p-8 transition-colors duration-300">
        <div className="w-16 h-16 bg-red-600 mb-6"></div>
        <h1 className="text-3xl font-black uppercase tracking-wider mb-2">System Fault [{error.code}]</h1>
        <p className="text-gray-500 mb-6">{error.message}</p>
        
        <div className="flex flex-col items-center gap-4">
          <button onClick={() => {setLoading(true); fetchData();}} className="px-6 py-3 border-2 border-black dark:border-white font-bold uppercase tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Reconnect
          </button>
          
          <a 
            href={`${REPO_URL}#${error.code}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-500 hover:text-black dark:hover:text-white transition-colors underline underline-offset-4"
          >
            Diagnostics & Resolution <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-[#050505] dark:text-white p-6 md:p-12 transition-colors duration-300 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b-2 dark:border-[#222] border-[#e5e5e5] pb-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 bg-black dark:bg-white"></div>
            <h1 className="text-2xl md:text-3xl font-black tracking-widest uppercase">Sentinel</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <ThemeToggle />
            <div className="px-4 py-2 border border-black dark:border-[#444] bg-gray-50 dark:bg-[#0a0a0a] flex items-center gap-2 shrink-0">
              <div className={`w-2 h-2 ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-xs font-bold uppercase tracking-widest">{loading ? 'Syncing' : 'Online'}</span>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 shrink-0">
              <LogOut className="w-3 h-3" /> Exit
            </button>
          </div>
        </header>

        {/* Hero Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l dark:border-[#222] border-[#e5e5e5] mb-16">
          <StatCard title="Pages Scanned" value={stats.scanned} />
          <StatCard title="Threats Blocked" value={stats.threatsBlocked} />
          <StatCard title="Trust Factor" value={`${Math.round(stats.trustScore)}%`} />
        </div>

        {/* Real-Time Table */}
        <div className="border border-black dark:border-[#333]">
          <div className="p-4 border-b border-black dark:border-[#333] bg-gray-100 dark:bg-[#111] flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest">Event Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white dark:bg-[#050505]">
                <tr>
                  <th className="px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5] text-xs font-bold uppercase tracking-widest text-gray-500">Target</th>
                  <th className="px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5] text-xs font-bold uppercase tracking-widest text-gray-500">Class</th>
                  <th className="px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5] text-xs font-bold uppercase tracking-widest text-gray-500">Conf</th>
                  <th className="px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5] text-xs font-bold uppercase tracking-widest text-gray-500">Severity</th>
                  <th className="px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5] text-xs font-bold uppercase tracking-widest text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#050505]">
                {recentEvents?.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-sm font-bold uppercase tracking-widest text-gray-400">No telemetry data</td>
                  </tr>
                ) : (
                  recentEvents?.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors">
                      <td className="px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5] font-mono text-xs max-w-[200px] truncate">{event.url}</td>
                      <td className={`px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5] text-xs font-bold uppercase tracking-widest ${!event.is_spoof ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500'}`}>
                        {!event.is_spoof ? 'Clear' : 'Spoof'}
                      </td>
                      <td className="px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5] text-xs font-mono">{(event.confidence_score).toFixed(1)}%</td>
                      <td className="px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5]">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest border ${
                          event.threat_level === 'High' ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-500 bg-red-50 dark:bg-red-950/20' : 
                          event.threat_level === 'Medium' ? 'border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-green-600 text-green-600 dark:border-green-500 dark:text-green-500 bg-green-50 dark:bg-green-950/20'
                        }`}>{event.threat_level}</span>
                      </td>
                      <td className="px-6 py-4 border-b dark:border-[#222] border-[#e5e5e5] text-xs font-mono text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value }) => (
  <div className="border-b border-r dark:border-[#222] border-[#e5e5e5] p-8 md:p-10 flex flex-col justify-center bg-transparent group hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors">
    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{title}</h3>
    <p className="text-4xl md:text-5xl font-black tracking-tight">{value}</p>
  </div>
);

export default Dashboard;