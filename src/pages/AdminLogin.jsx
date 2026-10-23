import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';

/** /admin/login — separate sign-in for administrators (no student navigation). */
export default function AdminLogin() {
  const { status, user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'loading') return null;
  if (user?.isAdmin && !busy) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form);
      if (!u.isAdmin) {
        await logout();
        setError('This account does not have admin access.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-1 w-full min-h-11 rounded-lg border border-slate-600 bg-slate-800 px-3 text-white placeholder:text-slate-500';
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 ring-1 ring-slate-800">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-xl font-bold text-white">Σ</div>
          <h1 className="mt-3 text-xl font-bold text-white">Admin sign in</h1>
          <p className="text-sm text-slate-400">Authorised staff only</p>
        </div>
        <label className="block text-sm font-medium text-slate-300">
          Email
          <input type="email" required autoComplete="username" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={field} />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-300">
          Password
          <input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={field} />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
        <button type="submit" disabled={busy} className="mt-6 min-h-11 w-full rounded-lg bg-indigo-600 font-semibold text-white disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
