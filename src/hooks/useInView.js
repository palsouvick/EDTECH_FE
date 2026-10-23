import { useEffect, useState } from 'react';

/**
 * true while the element crosses the middle band of the viewport (true if
 * IntersectionObserver is unavailable). A band, not a visible-ratio threshold:
 * a section with a long explanation open can be several screens tall, and a
 * ratio would report it "not in view" even while it fills the screen.
 */
export function useInView(ref) {
  const [inView, setInView] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '-35% 0px -35% 0px',
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}
