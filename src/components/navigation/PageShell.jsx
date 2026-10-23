import SiteHeader from './SiteHeader';
import Footer from './Footer';

/**
 * Header, page content, footer. A full-height column, so on short pages the
 * footer sits at the bottom of the screen instead of floating mid-page.
 * `padded={false}` for pages whose sections run edge to edge (the home hero).
 */
export default function PageShell({ children, className = '', padded = true }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <SiteHeader />
      <main className={`mx-auto w-full flex-1 ${padded ? 'px-4' : ''} ${className}`}>{children}</main>
      <Footer />
    </div>
  );
}
