import { useEffect, useRef } from 'react';
import { useOptionalAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';

const BEAT_MS = 60_000;
const MIN_SECTION_SEC = 20; // a section counts as read after ~20 s on it
const ANALYSED = ['quant', 'english'];

/**
 * Reading time for the learning analysis: while a signed-in student has a Math/English lesson
 * open AND visible, sends the seconds since the last beat (at most once a minute, max 120 s)
 * with the section on screen. Leaving a section after 20 s or more also sends it, so short
 * visits still mark it read. Hidden tabs and idle background time are not counted.
 */
export function useStudyHeartbeat({ subject, topic, section, sectionsTotal }) {
  const auth = useOptionalAuth();
  const source = useDataSource();
  const enabled = Boolean(auth?.user) && ANALYSED.includes(subject) && Boolean(topic) && typeof source.logStudyTime === 'function';
  const since = useRef(Date.now());
  const visibleMs = useRef(0);
  const sectionRef = useRef(section);

  const flush = (sec) => {
    const seconds = Math.min(120, Math.round(visibleMs.current / 1000));
    visibleMs.current = 0;
    if (seconds < 1) return;
    source
      .logStudyTime({ subject, topic, seconds, ...(sec && { section: sec }), ...(sectionsTotal && { sectionsTotal }) })
      .catch(() => {}); // best effort: never disturbs reading
  };
  const wasVisible = useRef(true);
  const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';
  // Adds the time since the last tick if the page was visible during it (the state BEFORE a change).
  const tick = () => {
    const now = Date.now();
    if (wasVisible.current) visibleMs.current += now - since.current;
    since.current = now;
    wasVisible.current = isVisible();
  };

  // Section change: count the time on the previous section.
  useEffect(() => {
    if (!enabled) return;
    const prev = sectionRef.current;
    sectionRef.current = section;
    if (prev === section) return;
    tick();
    if (visibleMs.current >= MIN_SECTION_SEC * 1000) flush(prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    since.current = Date.now();
    visibleMs.current = 0;
    wasVisible.current = isVisible();
    const beat = setInterval(() => {
      tick();
      flush(sectionRef.current);
    }, BEAT_MS);
    const onVisibility = () => tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(beat);
      document.removeEventListener('visibilitychange', onVisibility);
      tick();
      if (visibleMs.current >= MIN_SECTION_SEC * 1000) flush(sectionRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, subject, topic]);
}
