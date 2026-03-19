import { useState } from 'react';
import axios from 'axios';

interface AuthPageProps {
  onSuccess: (token: string, username: string) => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth${endpoint}`, {
        username,
        password
      });
      onSuccess(res.data.token, res.data.username);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred. Make sure the backend server is running.');
    }
  };

  return (
    <div className="flex flex-col items-center pt-[15vh] min-h-screen bg-[#1D1D20] text-[#DCE0E5] font-sans selection:bg-[#1A82E3]/40">
      <div className="w-full max-w-[400px] bg-[#292A2F] rounded-lg shadow-2xl overflow-hidden border border-[#1A1A1D]">
        
        {/* Xcode standard window header */}
        <div className="h-10 bg-gradient-to-b from-[#383A41] to-[#2B2D32] border-b border-[#1A1A1D] flex items-center px-4 justify-between">
          <div className="flex gap-2 w-16">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
          </div>
          <span className="text-[12px] font-semibold text-[#8C8C91] select-none tracking-wide text-center">
            {isLogin ? 'Sign In' : 'Create Account'}
          </span>
          <div className="w-16"></div>
        </div>

        <div className="p-8 pb-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1A82E3] to-[#1262AF] rounded-[18px] flex items-center justify-center shadow-md">
               <svg className="w-11 h-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
          </div>
          
          <h2 className="text-[20px] font-semibold text-center text-white mb-6 tracking-tight">
            Xcode Workspace Login
          </h2>
          
          {error && (
            <div className="bg-[#FF5F56]/10 border border-[#FF5F56]/30 text-[#FF5F56] px-3 py-2 rounded-md mb-6 text-[12px] flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-medium text-[#8C8C91] mb-1.5 ml-0.5">Username</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#1E1F24] rounded-md border border-[#1A1A1D] focus:border-[#1A82E3]/80 focus:ring-1 focus:ring-[#1A82E3]/80 outline-none transition-all text-white placeholder-[#8C8C91] text-[13px] shadow-inner"
                placeholder="Developer username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8C8C91] mb-1.5 ml-0.5">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 bg-[#1E1F24] rounded-md border border-[#1A1A1D] focus:border-[#1A82E3]/80 focus:ring-1 focus:ring-[#1A82E3]/80 outline-none transition-all text-white placeholder-[#8C8C91] text-[13px] shadow-inner"
                placeholder="Secure token"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full mt-3 bg-gradient-to-b from-[#1A82E3] to-[#1262AF] hover:from-[#258CE9] hover:to-[#1772C9] border border-[#0F5396] text-white font-medium py-2 rounded-md shadow-sm active:bg-[#0F5396] transition-colors text-[13px]"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-8 text-[12px] text-center text-[#8C8C91]">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="text-[#1A82E3] hover:text-[#258CE9] font-medium transition-colors"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
