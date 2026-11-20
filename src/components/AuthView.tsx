import { useEffect, useState, type FormEvent } from 'react';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import type { UserProfile } from '../types';
import { api } from '../lib/api';

interface AuthViewProps {
  initialTab?: 'student-login' | 'student-register' | 'admin-login';
  onAuthenticated: (user: UserProfile, token: string) => void;
}

export function AuthView({
  initialTab = 'student-login',
  onAuthenticated,
}: AuthViewProps) {
  const [tab, setTab] = useState<'student-login' | 'student-register' | 'admin-login'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student Login
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Student Register
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Admin Login / First-Run Claim
  const [adminClaimed, setAdminClaimed] = useState<boolean>(true);
  const [envPasscodeConfigured, setEnvPasscodeConfigured] = useState<boolean>(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    api
      .getAuthStatus()
      .then((res) => {
        setAdminClaimed(res.adminClaimed);
        setEnvPasscodeConfigured(res.envPasscodeConfigured);
      })
      .catch(() => undefined);
  }, []);

  const handleStudentLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, token } = await api.loginStudent({
        identifier: loginId,
        password: loginPassword,
      });
      onAuthenticated(user, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, token } = await api.registerStudent({
        fullName,
        rollNumber,
        email,
        mobileNumber,
        password: regPassword,
      });
      onAuthenticated(user, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!adminClaimed && !envPasscodeConfigured) {
        const { user, token } = await api.claimAdmin({
          fullName: adminName,
          email: adminEmail,
          password: adminPassword,
        });
        onAuthenticated(user, token);
      } else {
        const { user, token } = await api.loginAdmin({
          email: adminEmail,
          password: adminPassword,
        });
        onAuthenticated(user, token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const showFirstRunAdminClaim = tab === 'admin-login' && !adminClaimed && !envPasscodeConfigured;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-[#E7DDD0] overflow-hidden">
        {/* Segmented Auth Mode Tabs */}
        <div className="grid grid-cols-3 border-b border-[#E7DDD0] bg-[#FAF5EE] p-1.5 gap-1">
          <button
            type="button"
            onClick={() => {
              setTab('student-login');
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'student-login'
                ? 'bg-white text-[#2C1810] shadow-xs'
                : 'text-[#6E5649] hover:text-[#2C1810]'
            }`}
          >
            Student Login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('student-register');
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'student-register'
                ? 'bg-white text-[#2C1810] shadow-xs'
                : 'text-[#6E5649] hover:text-[#2C1810]'
            }`}
          >
            Student Register
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('admin-login');
              setError(null);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'admin-login'
                ? 'bg-[#2C1810] text-white'
                : 'text-[#6E5649] hover:text-[#2C1810]'
            }`}
          >
            Admin Login
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]">
              {error}
            </div>
          )}

          {tab === 'student-login' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="space-y-1">
                <h1 className="font-display font-bold text-2xl text-[#2C1810]">
                  Student Sign In
                </h1>
                <p className="text-sm text-[#6E5649]">
                  Access your pre-orders, pickup tokens, and order history.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  Email or College Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="student@college.edu or CS2024089"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </form>
          )}

          {tab === 'student-register' && (
            <form onSubmit={handleStudentRegister} className="space-y-4">
              <div className="space-y-1">
                <h1 className="font-display font-bold text-2xl text-[#2C1810]">
                  Create Student Account
                </h1>
                <p className="text-sm text-[#6E5649]">
                  Register once to pre-order from Block 2 and Apple &amp; Bees canteens.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Verma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                    College Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. EC2024104"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm uppercase text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@college.edu"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Account...' : 'Register & Continue'}</span>
              </button>
            </form>
          )}

          {tab === 'admin-login' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Canteen Management Portal</span>
                </div>
                <h1 className="font-display font-bold text-2xl text-[#2C1810]">
                  {showFirstRunAdminClaim ? 'First-Run Admin Setup' : 'Admin Sign In'}
                </h1>
                <p className="text-sm text-[#6E5649]">
                  {showFirstRunAdminClaim
                    ? 'Claim the canteen administrator account to manage menus, orders, and revenue for Block 2 and Apple & Bees.'
                    : 'Sign in to manage Block 2 Canteen and Apple & Bees Canteen menus and live orders.'}
                </p>
              </div>

              {showFirstRunAdminClaim && (
                <div>
                  <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                    Administrator Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Canteen Manager"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              )}

              {(!envPasscodeConfigured || showFirstRunAdminClaim || adminClaimed) && (
                <div>
                  <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required={!envPasscodeConfigured}
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@college.edu"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#6E5649] mb-1.5">
                  {envPasscodeConfigured ? 'Admin Passcode / Password' : 'Admin Password'}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={showFirstRunAdminClaim ? 'Choose a strong password (min 6 chars)' : 'Enter admin password'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CBB9] text-sm text-[#2C1810] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-[#2C1810] hover:bg-[#432519] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Verifying...'
                    : showFirstRunAdminClaim
                    ? 'Claim Admin Access'
                    : 'Sign In as Admin'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
