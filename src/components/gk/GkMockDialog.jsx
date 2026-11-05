import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useOptionalAuth } from '../../app/AuthContext';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { HAS_DEV_USER } from '../../lib/api';
import { MOCK } from '../../lib/i18n';
import { examStore } from '../../lib/examStore';
import { createExamState } from '../../features/mock/mockExamReducer';
import MockSetupDialog from '../mock/MockSetupDialog';
import { loginPath } from '../auth/AccountButton';

const SUBJECT_NAMES = {
  gs: { en: 'General Studies', bn: 'সাধারণ পাঠ' },
  quant: { en: 'Math', bn: 'গণিত' },
  english: { en: 'English', bn: 'ইংরেজি' },
};
const pick = (v, l) => v?.[l] || v?.en || '';

/**
 * Timed mock test over a set of GK chapters (one card, or a whole section such as
 * Indian GK), using the existing mock engine: the student picks the question count,
 * timer and language in the usual setup dialog. "Whole subject" means all General
 * Studies of the chosen exam category.
 *
 * Also used by Learn's Exam mode for Math and English chapters (`subject`, default General Studies).
 *
 * @param {{ open: boolean, onClose: () => void, category: string, subject?: string, topics: string[], name: {en,bn}, topicNames: Record<string,{en,bn}> }} props
 */
export default function GkMockDialog({ open, onClose, category = 'WBPSC', subject = 'gs', topics, name, topicNames = {} }) {
  const subjectName = SUBJECT_NAMES[subject] ?? SUBJECT_NAMES.gs;
  const source = useDataSource();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useOptionalAuth();
  const { setLang } = useLanguagePreference();
  // Mock sessions belong to an account on the server; offline fixtures and the dev test student need none.
  const needsLogin = source.kind === 'http' && !HAS_DEV_USER && auth?.status === 'ready' && !auth.user;

  const start = useCallback(
    async (cfg) => {
      const session = await source.createMock({
        category,
        subject,
        topicIds: cfg.scope === 'topic' ? topics : [],
        questionCount: cfg.questionCount,
        timeLimitMinutes: cfg.timeLimitMinutes,
        perQuestionTimer: cfg.timerMode === 'perQuestion',
        perQuestionSeconds: cfg.perQuestionSeconds,
        allowPause: cfg.allowPause,
        language: cfg.language,
      });
      const scopeName = cfg.scope === 'topic' ? name : subjectName;
      const exam = createExamState(session, {
        examName: Object.fromEntries(['en', 'bn', 'hi'].map((l) => [l, `${category} · ${pick(scopeName, l)} · ${MOCK.mockTest[l] ?? MOCK.mockTest.en}`])),
        category,
        subject,
        topic: cfg.scope === 'topic' && topics.length === 1 ? topics[0] : null,
        topicPath: location.pathname,
        topicNames,
      });
      await examStore.put(exam);
      setLang(cfg.language);
      navigate(`/mock/${session.sessionId}`, { state: { fresh: true } });
    },
    [source, category, subject, subjectName, topics, name, topicNames, location.pathname, setLang, navigate],
  );

  return (
    <MockSetupDialog
      open={open}
      onClose={onClose}
      onStart={start}
      topicName={name}
      subjectName={subjectName}
      loginHref={needsLogin ? loginPath(location) : null}
    />
  );
}
