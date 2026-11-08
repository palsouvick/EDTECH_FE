import SiteHeader from './SiteHeader';
import Footer from './Footer';
import { FocusBar, FocusSummary } from './FocusBar';
import { useFocus } from '../../lib/focusStore';

/**
 * Header, page content, footer. A full-height column, so on short pages the
 * footer sits at the bottom of the screen instead of floating mid-page.
 * `padded={false}` for pages whose sections run edge to edge (the home hero).
 * In Focus Mode the header and footer give way to the focus bar.
 */
export default function PageShell({ children, className = '', padded = true }) {
  const focus = useFocus();
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      {focus.active ? <FocusBar /> : <SiteHeader />}
      <main className={`mx-auto w-full flex-1 ${padded ? 'px-4' : ''} ${className}`}>{children}</main>
      {!focus.active && <Footer />}
      <FocusSummary />
    </div>
  );
}
