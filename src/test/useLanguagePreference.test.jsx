import { Profiler } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGE_STORAGE_KEY, languageStore, useLanguagePreference } from '../hooks/useLanguagePreference';
import { Localized, Tex } from '../components/topic-hub/Localized';
import LanguageSwitcher from '../components/topic-hub/LanguageSwitcher';

const html = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  act(() => languageStore.set('en'));
});

afterEach(() => vi.restoreAllMocks());

describe('useLanguagePreference', () => {
  it('persists the choice and applies it to <html>', () => {
    const { result } = renderHook(() => useLanguagePreference());
    expect(result.current.lang).toBe('en');

    act(() => result.current.setLang('bn'));
    expect(result.current.lang).toBe('bn');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('"bn"');
    expect(html.dataset.uiLang).toBe('bn');
    expect(html.lang).toBe('bn');
  });

  it('ignores unsupported codes and corrupt storage', () => {
    const { result } = renderHook(() => useLanguagePreference());
    act(() => result.current.setLang('fr'));
    expect(result.current.lang).toBe('en');

    localStorage.setItem(LANGUAGE_STORAGE_KEY, '{not json');
    act(() => languageStore.reload());
    expect(languageStore.get()).toBe('en');
  });

  it('switching does not re-render or remount localized content', async () => {
    const commits = vi.fn();
    render(
      <>
        <LanguageSwitcher />
        <Profiler id="content" onRender={commits}>
          <Localized value={{ en: 'Cost price', bn: 'ক্রয়মূল্য', hi: 'क्रय मूल्य' }} />
          <Tex latex="\dfrac{a}{b}" display />
        </Profiler>
      </>,
    );
    const katexNode = document.querySelector('.katex-display');
    const bnSlot = screen.getByText('ক্রয়মূল্য');
    commits.mockClear();

    await userEvent.click(screen.getByRole('radio', { name: 'বাংলা' }));

    expect(html.dataset.uiLang).toBe('bn');
    expect(screen.getByRole('radio', { name: 'বাংলা' })).toHaveAttribute('aria-checked', 'true');
    expect(commits).not.toHaveBeenCalled();
    expect(document.querySelector('.katex-display')).toBe(katexNode);
    expect(screen.getByText('ক্রয়মূল্য')).toBe(bnSlot);
  });

  it('keeps the first visible block in place when text height changes', () => {
    const anchor = document.createElement('div');
    anchor.setAttribute('data-scroll-anchor', '');
    document.body.append(anchor);
    // Bengali text is taller, so content above the anchor pushes it down by 60px.
    vi.spyOn(anchor, 'getBoundingClientRect').mockImplementation(() => {
      const top = html.dataset.uiLang === 'bn' ? 160 : 100;
      return { top, bottom: top + 50, height: 50, left: 0, right: 0, width: 0 };
    });
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});

    const { result } = renderHook(() => useLanguagePreference());
    act(() => result.current.setLang('bn'));

    expect(scrollBy).toHaveBeenCalledWith(0, 60);
    anchor.remove();
  });

  it('supports arrow-key navigation', async () => {
    render(<LanguageSwitcher />);
    screen.getByRole('radio', { name: 'English' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(languageStore.get()).toBe('bn');
    await userEvent.keyboard('{ArrowRight}');
    expect(languageStore.get()).toBe('en'); // wraps around: only English and Bengali
    await userEvent.keyboard('{ArrowLeft}');
    expect(languageStore.get()).toBe('bn');
    expect(screen.getByRole('radio', { name: 'বাংলা' })).toHaveFocus();
  });
});
