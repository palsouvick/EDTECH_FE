import { describe, expect, it } from 'vitest';
import { buildPyqRequest, examOptions, minMinutes, parseMinutes, subjectCounts, yearsFor } from '../lib/pyqPractice';

const t = (en, bn) => ({ en, bn });
const filters = {
  exams: [
    { name: 'WBCS (Exe.) Prelims', count: 1690, years: [2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015], papers: [] },
    { name: 'WBPSC Clerkship (Part-I)', count: 893, years: [2023, 2019, 2009, 2007, 2006, 2005, 2004], papers: [] },
    { name: 'Industrial Development Officer', count: 96, years: [2019], papers: [] },
    { name: 'WBP Constable', count: 0, years: [], papers: [] },
  ],
  topics: [
    { subject: 'quant', topic: 'percentage', count: 40, byYear: {} },
    { subject: 'quant', topic: 'profit_loss', count: 60, byYear: {} },
    { subject: 'english', topic: 'grammar', count: 90, byYear: {} },
    { subject: 'gs', topic: 'polity', count: 200, byYear: {} },
  ],
};

describe('PYQ practice helpers', () => {
  it('subject counts group /pyq/filters topics by subject', () => {
    expect(subjectCounts(filters.topics)).toEqual({ quant: 100, english: 90, gs: 200 });
    expect(subjectCounts([])).toEqual({ quant: 0, english: 0, gs: 0 });
  });

  it('exam options offer only the three exams with real papers', () => {
    expect(examOptions(filters).map((e) => e.name)).toEqual([
      'WBCS (Exe.) Prelims',
      'WBPSC Clerkship (Part-I)',
      'Industrial Development Officer',
    ]);
  });

  it('years come from the chosen exam, or every exam, newest first', () => {
    expect(yearsFor(filters, 'Industrial Development Officer')).toEqual([2019]);
    expect(yearsFor(filters, 'WBPSC Clerkship (Part-I)')).toEqual([2023, 2019, 2009, 2007, 2006, 2005, 2004]);
    expect(yearsFor(filters, null)).toEqual([2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2009, 2007, 2006, 2005, 2004]);
  });

  it('the request body carries the PYQ preset and only the filters that were chosen', () => {
    const base = { exam: '', count: 10, difficulty: 'mixed', repeat: 'all', yearMode: 'all', year: null, yearFrom: null, yearTo: null, time: 10, customMinutes: null };
    expect(buildPyqRequest('quant', base, 'en')).toEqual({
      subject: 'quant', preset: 'pyq', questionCount: 10, difficulty: 'mixed', mode: 'exam', language: 'en', repeatMode: 'all', timeLimitMinutes: 10,
    });
    expect(buildPyqRequest('english', { ...base, exam: 'WBPSC Clerkship (Part-I)', yearMode: 'one', year: 2023, difficulty: 'easy', repeat: 'wrong', time: 'custom', customMinutes: 25 }, 'bn')).toEqual({
      subject: 'english', preset: 'pyq', questionCount: 10, difficulty: 'easy', mode: 'exam', language: 'bn', repeatMode: 'wrong',
      pyqExam: 'WBPSC Clerkship (Part-I)', pyqYear: 2023, timeLimitMinutes: 25,
    });
    expect(buildPyqRequest('gs', { ...base, yearMode: 'recent' }, 'en')).toMatchObject({ pyqYear: 'recent' });
    expect(buildPyqRequest('gs', { ...base, yearMode: 'range', yearFrom: 2019, yearTo: 2024 }, 'en')).toMatchObject({ pyqYearFrom: 2019, pyqYearTo: 2024 });
  });

  it('custom time needs at least 10 seconds per question', () => {
    expect(minMinutes(10)).toBe(2);
    expect(minMinutes(100)).toBe(17);
    expect(parseMinutes('10', 10)).toBe(10);
    expect(parseMinutes('1', 10)).toBeNull();
    expect(parseMinutes('0', 10)).toBeNull();
    expect(parseMinutes('301', 10)).toBeNull();
    expect(parseMinutes('abc', 10)).toBeNull();
  });
});
