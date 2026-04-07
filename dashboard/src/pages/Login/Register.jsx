import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import ErrorAlert from '../../components/ErrorAlert';
import CONFIG from '../../config';

const API_BASE = CONFIG.API_BASE_URL;

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Structured error mapping
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError({
        code: 'ERR_VAL_001',
        message: 'Input Security Keys do not match.'
      });
    }
    
    setLoading(true);
    setError(null);

    try {
      /**
       * Attempt operative registration in Sentinel Core API
       */
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success: transition back to login stream
        navigate('/login');
      } else {
        // API Rejected
        setError({
          code: 'ERR_AUTH_002',
          message: data.error || 'Server rejected operative induction request.'
        });
      }
    } catch (err) {
      // Network Fault
      setError({
        code: 'ERR_NET_001',
        message: 'Cannot reach the Sentinel Core network.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-black dark:bg-[#050505] dark:text-white transition-colors duration-300">
      
      {/* Left Side Branding */}
      <div className="hidden lg:flex flex-col flex-1 p-12 border-r dark:border-[#222] border-[#e5e5e5] justify-between relative overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
        <div>
          <div className="w-12 h-12 bg-black dark:bg-white mb-8"></div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">Sentinel</h1>
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Operative Induction</h2>
        </div>
        <div className="flex gap-4">
          <div className="w-1 h-1 bg-black dark:bg-white"></div>
          <div className="w-4 h-1 bg-black dark:bg-white"></div>
          <div className="w-full h-1 bg-black dark:bg-white max-w-xs"></div>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 relative">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Request Access</h2>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Create operative profile</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Operative Email</label>
              <input 
                type="email" required
                className="w-full bg-transparent border-b-2 border-black dark:border-white py-3 px-0 text-xl font-bold focus:outline-none focus:border-green-500 transition-colors uppercase placeholder:normal-case placeholder:text-sm placeholder:text-gray-300 dark:placeholder:text-gray-700"
                placeholder="sentinel@defense.io"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mt-8">Create Key</label>
              <input 
                type="password" required
                className="w-full bg-transparent border-b-2 border-black dark:border-white py-3 px-0 text-xl font-bold focus:outline-none focus:border-green-500 transition-colors"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mt-8">Confirm Key</label>
              <input 
                type="password" required
                className="w-full bg-transparent border-b-2 border-black dark:border-white py-3 px-0 text-xl font-bold focus:outline-none focus:border-green-500 transition-colors"
                placeholder="••••••••"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <ErrorAlert error={error} />

            <button 
              type="submit" disabled={loading}
              className="w-full border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black py-4 font-black uppercase tracking-widest transition-all mt-8 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-12 flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            <Link to="/login" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 group-hover:bg-black dark:group-hover:bg-white transition-colors"></div> Return to Login
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Register;