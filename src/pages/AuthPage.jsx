import { useId, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { AUTH, FUNNEL } from '../lib/i18n';
import { paths } from '../lib/routes';
import LanguageSwitcher from '../components/topic-hub/LanguageSwitcher';
import { Localized } from '../components/topic-hub/Localized';
import Footer from '../components/navigation/Footer';
import { PRIVACY } from '../lib/homeCopy';
import { SigmaIcon } from '../components/topic-hub/icons';

/** Only same-site paths, so ?next= cannot send students to another site. */
function safeNext(raw) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : paths.exams();
}

function Field({ label, hint, error, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800 dark:text-slate-100">
        <Localized value={label} />
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="mt-1 text-xs text-red-700 dark:text-red-400">{error}</p>
      ) : (
        hint && (
          <p id={`${id}-msg`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <Localized value={hint} />
          </p>
        )
      )}
    </div>
  );
}

const input =
  'mt-1 block min-h-11 w-full rounded-xl border-0 bg-white px-3 text-base text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-950 dark:text-white dark:ring-slate-700';

/** /login and /register. After success, returns to ?next= (the page that sent the student here). */
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { status, user, login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const id = useId();

  if (status === 'ready' && user && !busy) return <Navigate to={next} replace />;

  const fieldErrors = Object.fromEntries((Array.isArray(error?.details) ? error.details : []).map((d) => [d.path, d.message]));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
      navigate(next, { replace: true });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  const other = `/${isRegister ? 'login' : 'register'}${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
        <Link to={paths.exams()} className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <SigmaIcon width={18} height={18} />
          </span>
          <Localized value={FUNNEL.brand} />
        </Link>
        <LanguageSwitcher />
      </header>

      <div className="flex-1 px-4 pb-16">
        <main className="mx-auto mt-6 max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <Localized value={isRegister ? AUTH.registerTitle : AUTH.loginTitle} />
          </h1>
          <Localized value={AUTH.why} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            {isRegister && (
              <Field id={`${id}-name`} label={AUTH.name} error={fieldErrors.name}>
                <input
                  id={`${id}-name`}
                  className={input}
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={set('name')}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? `${id}-name-msg` : undefined}
                />
              </Field>
            )}
            <Field id={`${id}-email`} label={AUTH.email} error={fieldErrors.email}>
              <input
                id={`${id}-email`}
                className={input}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set('email')}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? `${id}-email-msg` : undefined}
              />
            </Field>
            {isRegister && (
              <Field id={`${id}-mobile`} label={AUTH.mobile} hint={AUTH.mobileHint} error={fieldErrors.mobile}>
                <input
                  id={`${id}-mobile`}
                  className={input}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={14}
                  placeholder="9876543210"
                  value={form.mobile}
                  onChange={set('mobile')}
                  aria-invalid={!!fieldErrors.mobile}
                  aria-describedby={`${id}-mobile-msg`}
                />
              </Field>
            )}
            <Field id={`${id}-password`} label={AUTH.password} hint={isRegister ? AUTH.passwordHint : null} error={fieldErrors.password}>
              <div className="relative">
                <input
                  id={`${id}-password`}
                  className={`${input} pr-20`}
                  type={showPw ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  minLength={isRegister ? 8 : undefined}
                  value={form.password}
                  onChange={set('password')}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={isRegister || fieldErrors.password ? `${id}-password-msg` : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-pressed={showPw}
                  className="absolute inset-y-1 right-1 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Localized value={showPw ? AUTH.hidePassword : AUTH.showPassword} />
                </button>
              </div>
            </Field>

            {error && !Object.keys(fieldErrors).length && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
                {error.message}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="min-h-12 w-full rounded-xl bg-indigo-600 px-5 text-base font-semibold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60"
            >
              <Localized value={busy ? AUTH.submitting : isRegister ? AUTH.register : AUTH.login} />
            </button>
            {isRegister && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                <Localized value={PRIVACY.consent} />{' '}
                <Link to="/privacy" className="font-semibold text-indigo-700 underline dark:text-indigo-300">
                  <Localized value={PRIVACY.linkLabel} />
                </Link>
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            <Localized value={isRegister ? AUTH.haveAccount : AUTH.noAccount} />{' '}
            <Link to={other} replace className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
              <Localized value={isRegister ? AUTH.login : AUTH.register} />
            </Link>
          </p>
        </main>
      </div>
      <Footer />
    </div>
  );
}
