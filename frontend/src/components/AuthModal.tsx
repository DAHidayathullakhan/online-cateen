import React, { useState } from 'react';
import { X, User, Lock, Mail, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loginKey, setLoginKey] = useState('student@canteen.edu');
  const [password, setPassword] = useState('password123');

  // Register fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('STU-2026-001');
  const [degreeLevel, setDegreeLevel] = useState<'Degree' | "Master's">('Degree');
  const [course, setCourse] = useState('BCA');
  const [collegeId, setCollegeId] = useState('');
  const [colleges, setColleges] = useState<{ id: string; name: string; code: string }[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/colleges')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setColleges(data.data);
          setCollegeId(data.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const performLogin = async (key: string, pass: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginKey: key, password: pass })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      localStorage.setItem('smart_campus_jwt', data.token);
      localStorage.setItem('smart_campus_user', JSON.stringify(data.data));
      onLoginSuccess(data.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred while signing in.');
    } finally {
      setLoading(false);
    }
  };

  const performRegister = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          studentId: studentId.trim(),
          role: degreeLevel === "Master's" ? "Master's Student" : 'Student',
          degreeLevel,
          programType: course,
          course,
          department: 'Computer Applications',
          collegeId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed. Please check your details.');
      }

      localStorage.setItem('smart_campus_jwt', data.token);
      localStorage.setItem('smart_campus_user', JSON.stringify(data.data));
      onLoginSuccess(data.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      performRegister();
    } else {
      performLogin(loginKey, password);
    }
  };

  const handleQuickLogin = (emailVal: string) => {
    setLoginKey(emailVal);
    setPassword('password123');
    performLogin(emailVal, 'password123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 text-2xl font-black">
              🎓
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {isRegister ? 'Student Registration' : 'Campus Sign In'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {isRegister
                ? 'Create your account for lunch reservations & room delivery'
                : 'Sign in with your College Email or Student ID'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Student ID</label>
                    <input
                      type="text"
                      required
                      placeholder="STU-2026-001"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Degree Level</label>
                    <select
                      value={degreeLevel}
                      onChange={(e) => setDegreeLevel(e.target.value as any)}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Degree">Undergraduate</option>
                      <option value="Master's">Postgraduate (Master's)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Academic Program</label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="BCA">BCA - Computer Applications</option>
                    <option value="BBA">BBA - Business Administration</option>
                    <option value="BCom">BCom - Commerce</option>
                    <option value="BSc">BSc - Science</option>
                    <option value="MCA">MCA - Master of Computer Applications</option>
                    <option value="MBA">MBA - Master of Business Administration</option>
                  </select>
                </div>

                {colleges.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Campus / College</label>
                    <select
                      value={collegeId}
                      onChange={(e) => setCollegeId(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                    >
                      {colleges.map(c => (
                        <option key={c.id} value={c.id}>
                          🏛️ {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isRegister ? 'College Email' : 'Email or Student ID'}
              </label>
              <input
                type="text"
                required
                placeholder={isRegister ? 'student@canteen.edu' : 'student@canteen.edu or STU-2026-001'}
                value={isRegister ? email : loginKey}
                onChange={(e) => isRegister ? setEmail(e.target.value) : setLoginKey(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-sm transition-all shadow-md shadow-blue-500/25 mt-2 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? (isRegister ? 'Creating Account...' : 'Signing In...') : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="text-center mt-4 text-xs font-semibold text-slate-500">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setErrorMsg(null); }}
                  className="font-extrabold text-blue-600 hover:underline"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                New student?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setErrorMsg(null); }}
                  className="font-extrabold text-blue-600 hover:underline"
                >
                  Register here
                </button>
              </span>
            )}
          </div>

          {/* Quick Demo Switcher - Uses real backend accounts */}
          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block text-center mb-2.5">
                Quick 1-Click Demo Login (Supabase Verified Accounts)
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('student@canteen.edu')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 text-center"
                >
                  Student
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('kitchen@canteen.edu')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-amber-700 text-center"
                >
                  Kitchen Staff
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('delivery@canteen.edu')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-emerald-700 text-center"
                >
                  Delivery
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('operator@canteen.edu')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-purple-700 text-center"
                >
                  Counter Operator
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('admin@canteen.edu')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-blue-700 text-center col-span-2"
                >
                  System Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
