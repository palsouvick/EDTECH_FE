import { useEffect, useRef } from 'react';

const OPTION_KEYS = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Practice shortcuts, active only while `enabled` (the arena is on screen and
 * no dialog is open):
 *
 *   A–D / 1–4      choose an option
 *   ↑ ↓            move the selection
 *   Enter          check the answer, then go to the next question
 *   →              next question (after checking)
 *   S              bookmark for revision
 *
 * Ignored while typing, with modifier keys, or when focus is on a button
 * (Enter there should press that button, not check the answer).
 */
export function useArenaKeyboard({ enabled, phase, options, onSelect, onMove, onCheck, onNext, onBookmark }) {
  const handlers = useRef({});
  handlers.current = { phase, options, onSelect, onMove, onCheck, onNext, onBookmark };

  useEffect(() => {
    if (!enabled) return undefined;

    function onKeyDown(e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      const h = handlers.current;
      const key = e.key.toLowerCase();

      if (key in OPTION_KEYS) {
        const option = h.options?.[OPTION_KEYS[key]];
        if (option && h.phase === 'answering') {
          e.preventDefault();
          h.onSelect(option.optionId);
        }
        return;
      }

      switch (key) {
        case 'arrowdown':
        case 'arrowup':
          if (h.phase !== 'answering') return;
          e.preventDefault();
          {
            const focused = e.target instanceof HTMLElement ? e.target.closest('[data-arena-option]') : null;
            const from = focused ? h.options?.[[...focused.parentElement.children].indexOf(focused)]?.optionId : undefined;
            h.onMove(key === 'arrowdown' ? 1 : -1, from);
          }
          return;
        case 'enter': {
          const onButton = e.target instanceof HTMLElement && e.target.closest('button, a, [role="radio"]');
          if (onButton && !onButton.matches('[data-arena-option]')) return;
          if (h.phase === 'answering') {
            e.preventDefault();
            h.onCheck();
          } else if (h.phase === 'revealed') {
            e.preventDefault();
            h.onNext();
          }
          return;
        }
        case 'arrowright':
          if (h.phase === 'revealed') {
            e.preventDefault();
            h.onNext();
          }
          return;
        case 's':
          e.preventDefault();
          h.onBookmark();
          return;
        default:
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
