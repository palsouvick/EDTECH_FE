import { render, screen, within } from '@testing-library/react';
import { act } from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { structure, StructuredText } from '../components/topic-hub/StructuredText';
import { languageStore } from '../hooks/useLanguagePreference';

const UN = 'রাষ্ট্রসংঘ (UN)\nসদর দপ্তর: নিউ ইয়র্ক, যুক্তরাষ্ট্র\nসনদ স্বাক্ষরিত: ২৬ জুন ১৯৪৫ (সান ফ্রান্সিসকো)\nসদস্য রাষ্ট্র: ১৯৩\nআন্তর্জাতিক বিচার আদালতের আসন হেগে (নেদারল্যান্ডস) — নিউ ইয়র্কের বাইরে থাকা একমাত্র প্রধান অঙ্গ।';
const WB = "World Bank Group — Headquarters: Washington DC\nIBRD – Reconstruction and Development – 1944 (lends to governments)\nIDA – Development Association – 1960 (interest-free loans)\nMIGA – 1988 (insures investors)\nIn the narrow sense 'World Bank' means IBRD + IDA.";

beforeEach(() => act(() => languageStore.set('en')));

describe('structured fact statements', () => {
  it('label lines become a two-column table under a lead line; prose stays prose', () => {
    const b = structure(UN);
    expect(b.map((x) => x.type)).toEqual(['lead', 'table', 'text']);
    expect(b[1].rows).toEqual([['সদর দপ্তর', 'নিউ ইয়র্ক, যুক্তরাষ্ট্র'], ['সনদ স্বাক্ষরিত', '২৬ জুন ১৯৪৫ (সান ফ্রান্সিসকো)'], ['সদস্য রাষ্ট্র', '১৯৩']]);
  });

  it('dash rows become table rows; a short row keeps its last cell in the last column', () => {
    const b = structure(WB);
    expect(b.map((x) => x.type)).toEqual(['lead', 'table', 'text']);
    expect(b[1].rows[2]).toEqual(['MIGA', '', '1988 (insures investors)']);
  });

  it('one-line text is untouched markdown; long prose with a dash is not a table', () => {
    expect(structure('Just one sentence.')).toEqual([{ type: 'markdown', text: 'Just one sentence.' }]);
    const prose = 'On the night of 2–3 December 1984, methyl isocyanate (MIC) leaked at a plant in Bhopal, Madhya Pradesh — thousands died.\nThe legal aftershocks came in sequence.';
    expect(structure(prose).every((x) => x.type === 'text')).toBe(true);
  });

  it('renders the rows as a table', () => {
    render(<StructuredText value={{ en: WB, bn: WB }} />);
    const table = screen.getAllByRole('table')[0];
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByText('IDA')).toBeInTheDocument();
  });

  it('every library statement parses, and the multi-line ones mostly gain structure', () => {
    const dir = path.resolve(__dirname, '../../../EDTECH_BE/db/gk');
    let multi = 0;
    let structured = 0;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.jsonl'))) {
      for (const line of readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/).filter(Boolean)) {
        const { statement } = JSON.parse(line);
        for (const text of [statement.en, statement.bn]) {
          const blocks = structure(text);
          expect(blocks.length).toBeGreaterThan(0);
          if (text.includes('\n')) {
            multi += 1;
            if (blocks.some((b) => b.type === 'table' || b.type === 'heading' || b.type === 'lead')) structured += 1;
          }
        }
      }
    }
    expect(multi).toBeGreaterThan(50);
    expect(structured / multi).toBeGreaterThan(0.5);
  });
});

describe('key-point highlighting', () => {
  const metro = 'কলকাতা মেট্রো ভারতের প্রথম এবং এশিয়ার পঞ্চম মেট্রো। ইন্দিরা গান্ধী ১৯৭২ সালের ২৯ ডিসেম্বর ভিত্তিপ্রস্তর স্থাপন করেন; এসপ্ল্যানেড থেকে নেতাজি ভবন (৩.৪০ কিমি, পাঁচটি স্টেশন)।';

  it('marks the exam answers as key terms, and dates, years and distances as numbers', async () => {
    const { highlightParts } = await import('../components/topic-hub/Localized');
    const parts = highlightParts(metro, ['এসপ্ল্যানেড থেকে নেতাজি ভবন']);
    const marked = parts.filter(([, k]) => k).map(([t, k]) => `${k}:${t}`);
    expect(marked).toEqual(['num:১৯৭২', 'num:২৯ ডিসেম্বর', 'key:এসপ্ল্যানেড থেকে নেতাজি ভবন', 'num:৩.৪০ কিমি']);
    expect(parts.map(([t]) => t).join('')).toBe(metro);
  });

  it('English dates and single digits inside words are handled', async () => {
    const { highlightParts } = await import('../components/topic-hub/Localized');
    const marked = highlightParts('Partial service began on 24 October 1984 over 3.40 km; the G7 met in 2025.', []).filter(([, k]) => k).map(([t]) => t);
    expect(marked).toEqual(['24 October 1984', '3.40 km', '2025']);
  });

  it('renders the marks on the statement', () => {
    const { container } = render(<StructuredText value={{ en: 'Esplanade to Netaji Bhavan opened in 1984.' }} highlights={{ en: ['Esplanade to Netaji Bhavan'] }} />);
    expect(container.querySelector('.hl-key').textContent).toBe('Esplanade to Netaji Bhavan');
    expect(container.querySelector('.hl-num').textContent).toBe('1984');
  });
});
