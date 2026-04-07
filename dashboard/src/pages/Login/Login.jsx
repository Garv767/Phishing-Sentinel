import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Demo from "../../components/Demo/Demo";
import ThemeToggle from '../../components/ThemeToggle';
import ErrorAlert from '../../components/ErrorAlert';
import CONFIG from '../../config';

const API_BASE = CONFIG.API_BASE_URL;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Stores structured error objects
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      /**
       * Authenticate Operative against core Sentinel cluster
       */
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Persist secure token locally
        localStorage.setItem('sentinel_token', data.token);

        // Broadcast token to the Chrome Extension namespace for cross-communication
        const SENTINEL_EXT_ID = "ankdnkinpgjkncgjphbjdpjaallligim";

        if(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage){
            chrome.runtime.sendMessage(SENTINEL_EXT_ID, {
                type: "SYNC_TOKEN",
                token: data.token
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("[Sentinel] Extension sync failed. Verify installation.");
                } else {
                    console.info("[Sentinel] Secure token synchronized to extension layer.");
                }
            });
        }
        
        navigate('/dashboard');
      } else {
        // Handle rejected authentication
        setError({
          code: 'ERR_AUTH_001',
          message: data.error || 'Authentication sequence rejected. Invalid credentials.'
        });
      }
    } catch (err) {
      // Handle network or server offline disruptions
      setError({
        code: 'ERR_NET_001',
        message: 'Unable to reach the Sentinel cluster network.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showDemo && <Demo onClose={() => setShowDemo(false)} />}
      <div className="min-h-screen flex bg-white text-black dark:bg-[#050505] dark:text-white transition-colors duration-300">
        
        {/* Left Side Branding */}
        <div className="hidden lg:flex flex-col flex-1 p-12 border-r dark:border-[#222] border-[#e5e5e5] justify-between relative overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
          <div>
            <div className="w-12 h-12 bg-black dark:bg-white mb-8"></div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">Sentinel</h1>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Phishing Defense Network</h2>
          </div>
          <div className="flex gap-4">
            <div className="w-full h-1 bg-black dark:bg-white max-w-xs"></div>
            <div className="w-4 h-1 bg-black dark:bg-white"></div>
            <div className="w-1 h-1 bg-black dark:bg-white"></div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-16 relative">
          <div className="absolute top-8 right-8">
            <ThemeToggle />
          </div>

          <div className="max-w-md w-full mx-auto">
            <div className="mb-12">
              <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Portal Access</h2>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Authenticate to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Operative ID</label>
                <input 
                  type="email" required
                  className="w-full bg-transparent border-b-2 border-black dark:border-white py-3 px-0 text-xl font-bold focus:outline-none focus:border-green-500 transition-colors uppercase placeholder:normal-case placeholder:text-sm placeholder:text-gray-300 dark:placeholder:text-gray-700"
                  placeholder="operative@sentinel.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mt-8">Security Key</label>
                <input 
                  type="password" required
                  className="w-full bg-transparent border-b-2 border-black dark:border-white py-3 px-0 text-xl font-bold focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <ErrorAlert error={error} />

              <button 
                type="submit" disabled={loading}
                className="w-full border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black py-4 font-black uppercase tracking-widest transition-all mt-8 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Initialize Session'}
              </button>
            </form>

            <div className="mt-12 flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
              <Link to="/register" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 group-hover:bg-black dark:group-hover:bg-white transition-colors"></div> Request Access
              </Link>
              <button onClick={() => setShowDemo(true)} className="text-left hover:text-black dark:hover:text-white transition-colors flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 group-hover:bg-black dark:group-hover:bg-white transition-colors"></div> Run Demo Protocol
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Login;