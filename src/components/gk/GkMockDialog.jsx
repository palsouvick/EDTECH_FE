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

const GS_NAME = { en: 'General Studies', bn: 'সাধারণ পাঠ' };
const pick = (v, l) => v?.[l] || v?.en || '';

/**
 * Timed mock test over a set of GK chapters (one card, or a whole section such as
 * Indian GK), using the existing mock engine: the student picks the question count,
 * timer and language in the usual setup dialog. "Whole subject" means all General
 * Studies of the chosen exam category.
 *
 * @param {{ open: boolean, onClose: () => void, category: string, topics: string[], name: {en,bn}, topicNames: Record<string,{en,bn}> }} props
 */
export default function GkMockDialog({ open, onClose, category = 'WBPSC', topics, name, topicNames = {} }) {
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
        subject: 'gs',
        topicIds: cfg.scope === 'topic' ? topics : [],
        questionCount: cfg.questionCount,
        timeLimitMinutes: cfg.timeLimitMinutes,
        perQuestionTimer: cfg.timerMode === 'perQuestion',
        perQuestionSeconds: cfg.perQuestionSeconds,
        allowPause: cfg.allowPause,
        language: cfg.language,
      });
      const scopeName = cfg.scope === 'topic' ? name : GS_NAME;
      const exam = createExamState(session, {
        examName: Object.fromEntries(['en', 'bn', 'hi'].map((l) => [l, `${category} · ${pick(scopeName, l)} · ${MOCK.mockTest[l] ?? MOCK.mockTest.en}`])),
        category,
        subject: 'gs',
        topic: cfg.scope === 'topic' && topics.length === 1 ? topics[0] : null,
        topicPath: location.pathname,
        topicNames,
      });
      await examStore.put(exam);
      setLang(cfg.language);
      navigate(`/mock/${session.sessionId}`, { state: { fresh: true } });
    },
    [source, category, topics, name, topicNames, location.pathname, setLang, navigate],
  );

  return (
    <MockSetupDialog
      open={open}
      onClose={onClose}
      onStart={start}
      topicName={name}
      subjectName={GS_NAME}
      loginHref={needsLogin ? loginPath(location) : null}
    />
  );
}
