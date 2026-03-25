import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import Demo from "../../components/Demo/Demo";
import CONFIG from '../../config';

const API_BASE = CONFIG.API_BASE_URL;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('sentinel_token', data.token);

    // Get your Extension ID from chrome://extensions
    const SENTINEL_EXT_ID = "ankdnkinpgjkncgjphbjdpjaallligim";//"jlhddlkhohfggefbglbheonnaclgipei";// "YOUR_EXTENSION_ID_HERE"; 

    if(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage){ //if (window.chrome && chrome.runtime) {
        chrome.runtime.sendMessage(SENTINEL_EXT_ID, {
            type: "SYNC_TOKEN",
            token: data.token
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Extension not found or not linked.");
            } else {
                console.log("Token successfully handed to extension.");
            }
        });
    } else {
        console.warn("Chrome Extension API not detected. Make sure the extension is installed.");
    }
        
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      //console.error("Login Error:", err);
      setError('Sentinel Server is offline. Ensure Go is running on :8080');
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
      {showDemo && <Demo onClose={() => setShowDemo(false)} />}
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-cyan-500/10 rounded-xl mb-4">
              <ShieldCheck className="w-10 h-10 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">SENTINEL <span className="text-cyan-400">AUTH</span></h1>
            <p className="text-slate-400 text-sm mt-2">Secure access to the phishing observation hub</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Operative Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input 
                  type="email" required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  placeholder="operative@sentinel.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input 
                  type="password" required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center animate-shake">
                {error}
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Initialize Session'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              New operative?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Join the Network
              </Link>
            </p>
          </div>
          <div className='text-center border-t border-slate-800 pt-6 text-slate-400 text-sm mt-2'>
            <button onClick={() => setShowDemo(true)}>
              Try the Demo — no account needed
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;