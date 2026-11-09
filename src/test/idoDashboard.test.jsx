import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import IdoDashboardPage from '../pages/IdoDashboardPage';

const L = (en, bn) => ({ en, bn: bn ?? en, hi: en });

const idoExam = {
  code: 'WBPSC_IDO',
  name: L('IDO — Industrial Development Officer', 'IDO — শিল্প উন্নয়ন আধিকারিক'),
  fullName: L('Industrial Development Officer (IDO), Directorate of Micro, Small & Medium Enterprises'),
  patternAsOf: 'IDO detailed advertisement (Advt 15/2024, dated 5 Nov 2026)',
  sourceUrl: 'https://psc.wb.gov.in/Download?param1=Cur_20261105212424_DetailedAdvtIDO152024.pdf&param2=advertisement',
  stages: [
    {
      tier: 'PRELIMS',
      name: L('Part-I (Written Examination)'),
      mode: 'OMR',
      durationMin: 90,
      totalQuestions: 100,
      totalMarks: 100,
      sections: [
        { subject: 'english', title: L('English', 'ইংরেজি'), questions: 15, marks: 15, marksEach: 1, negative: 0.25 },
        { subject: 'gs', title: L('Physical Science', 'ভৌত বিজ্ঞান'), questions: 15, marks: 15, marksEach: 1, negative: 0.25 },
      ],
    },
  ],
  nextStages: [L('Part-II: Interview (15 marks)')],
  cycles: [],
  notes: L('247 vacancies.'),
};

/**
 * Regression: the dashboard fed ExamInfoPanel the subjects of the
 * listCategories summary (which has none) and the whole page crashed on
 * subjects.map. Subjects must come from getCategory.
 */
describe('IDO dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearResourceCache();
    languageStore.set('en');
  });

  it('renders the dashboard and the official exam panel without crashing', async () => {
    const base = createFixtureDataSource({ latencyMs: 0 });
    const source = {
      ...base,
      getCategory: async () => ({
        category: { code: 'WBPSC', name: L('WBPSC'), website: 'https://psc.wb.gov.in', exams: [idoExam] },
        subjects: [{ code: 'gs', name: L('General Studies', 'সাধারণ অধ্যয়ন'), topicCount: 9, questionCount: 500 }],
      }),
      getIdoPlan: async () => ({
        code: 'IDO',
        sections: [
          { key: 'english', title: L('English', 'ইংরেজি'), count: 15, subject: 'english', topic: 'grammar' },
          { key: 'safety', title: L('Industrial Safety & Pollution Control', 'শিল্প নিরাপত্তা ও দূষণ নিয়ন্ত্রণ'), count: 10, subject: 'gs', topic: 'industrial_safety' },
        ],
        phases: [],
        days: [],
      }),
    };
    render(
      <DataSourceProvider source={source}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/ido']}>
            <Routes>
              <Route path="/ido" element={<IdoDashboardPage />} />
              <Route path="*" element={<p>elsewhere</p>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </DataSourceProvider>,
    );

    expect(await screen.findByText('IDO — Industrial Development Officer', { exact: false })).toBeInTheDocument();
    // A section row from the plan payload (it also recurs in the practice links)…
    expect((await screen.findAllByText('Industrial Safety & Pollution Control')).length).toBeGreaterThan(0);
    // …and the exam panel itself (this is what used to crash the page).
    expect(await screen.findByText('Industrial Development Officer (IDO), Directorate of Micro, Small & Medium Enterprises')).toBeInTheDocument();
    expect(screen.getByText('Physical Science')).toBeInTheDocument();
  });
});
