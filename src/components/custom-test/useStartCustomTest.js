import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { examStore } from '../../lib/examStore';
import { createExamState } from '../../features/mock/mockExamReducer';
import { CT } from '../../lib/customTestCopy';
import { learnPaths } from '../../lib/routes';

export const customPracticePath = (sessionId) => `/practice/custom/${sessionId}`;

/**
 * Creates a custom test and opens it: exam mode in the CBT exam screen (/mock/:id, with its
 * palette, timer and recovery), practice mode in the practice runner (/practice/custom/:id).
 */
export function useStartCustomTest() {
  const source = useDataSource();
  const navigate = useNavigate();
  return useCallback(
    async (body) => {
      const session = await source.createCustomTest(body);
      if (session.custom?.mode === 'practice') {
        navigate(customPracticePath(session.sessionId));
        return session;
      }
      const preset = CT.presetNames[session.custom?.preset] ?? CT.presetNames.custom;
      const subject = CT.subjects[body.subject];
      const exam = createExamState(session, {
        examName: Object.fromEntries(['en', 'bn'].map((l) => [l, `${subject[l]} · ${preset[l]}`])),
        category: 'WBPSC',
        subject: body.subject,
        topic: null,
        topicPath: learnPaths.subject(body.subject),
        custom: true,
      });
      await examStore.put(exam);
      navigate(`/mock/${session.sessionId}`, { state: { fresh: true } });
      return session;
    },
    [source, navigate],
  );
}
