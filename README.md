# Exam Engine: frontend

React 19 + Vite + Tailwind CSS 4. Contains the study page's **Topic Rule & Concept Hub**.

```
cp .env.example .env     # VITE_USE_FIXTURES=true: walk the funnel offline (Profit & Loss has content)
npm install
npm run dev              # http://localhost:5173, /api proxied to the backend on :3000
npm test                 # Vitest + Testing Library
npm run build
```

## Routes: the selection funnel

The URL is the selection state, so refresh, Back/Forward and shared links all
restore the same step. Configuration is in [App.jsx](src/App.jsx):

| Path | Page | |
|---|---|---|
| `/exams` | [CategorySelect](src/pages/funnel/CategorySelect.jsx) | SSC · Banking · WBPSC · WB Post Office, with their exams; "Continue where you left off" |
| `/exams/:category` | [SubjectSelect](src/pages/funnel/SubjectSelect.jsx) | Subjects + study-language pills; question counts follow the language. On the right is "About the exam" ([ExamInfoPanel](src/components/exam-info/ExamInfoPanel.jsx)), with one tab per exam (CGL / CHSL / MTS). Each tab shows the first-stage pattern, our question count per section, the next stages, past exam dates and vacancies, and source links. The open tab is kept in `?exam=` |
| `/exams/:category/:subject` | [TopicList](src/pages/funnel/TopicList.jsx) | Topics with difficulty, PYQ count, "Study & Practice" (or "Coming soon" when empty) |
| `/exams/:category/:subject/:topicSlug` | [StudyPage](src/pages/StudyPage.jsx) | Concept hub + Practice Arena; breadcrumbs link back to each step |
| `/login`, `/register` | [AuthPage](src/pages/AuthPage.jsx) | `?next=` returns the student to the page they came from (same-site paths only) |
| `/me` | [PerformancePage](src/pages/PerformancePage.jsx) | My performance. Signed-in only; signed-out visitors are sent to log in |

**Accounts.** [AuthContext](src/app/AuthContext.jsx) loads the student from `/auth/me`. The session is an httpOnly cookie, so no token is stored in the page.

- Both headers have an account button: "Log in", or the student's initials with a menu for My performance and Log out.
- Mock tests are saved to an account, so the mock setup dialog asks signed-out students to log in. The exceptions are offline fixtures and dev builds with `VITE_DEV_USER_ID` set.
- Offline (`VITE_USE_FIXTURES=true`), any email with a password of 8+ characters signs in to a local demo account.

URL slugs are lowercase and hyphenated (`/exams/wb-post/quant/profit-loss`).
Nothing falls back to a hard-coded topic. `/` and unknown paths go to
`/exams`, and an unknown category, subject or topic redirects to the nearest
valid step.

Data comes from one source object ([lib/dataSource.js](src/lib/dataSource.js)): the API, or offline fixtures when `VITE_USE_FIXTURES=true`.

**Fixtures.** The offline catalogue [src/fixtures/catalog.js](src/fixtures/catalog.js) is generated from `backend/db/seed/catalog.js` by `npm run fixtures:catalog`; don't edit it by hand. Offline, only Profit & Loss has content (12 questions + notes) and it is served under every category. Every other topic shows "Coming soon".

## Concept Hub

```jsx
import TopicSummaryHeader from './components/topic-hub/TopicSummaryHeader';

// data = GET /api/v1/practice/topic-summary?category=SSC&subject=quant&topic=profit_loss
<main className="pb-40 sm:pb-32">          {/* room for the fixed CTA bar */}
  <TopicSummaryHeader
    breadcrumb={data.breadcrumb}
    summary={data.summary}
    progress={serverProgress}              // optional; on-device tracker if omitted
    onStartPractice={() => scrollToQuestions()}
    onLaunchMock={({ questionCount, timeLimitMinutes }) => createMock(...)}
  />
  <QuestionList />
</main>
```

The component renders three siblings: the sticky quick-nav, the hub, and the
fixed CTA bar. Mount it directly in the page's scrolling container. Inside a
short wrapper, `position: sticky` stops at the end of the wrapper.

| File | Role |
|---|---|
| [TopicSummaryHeader.jsx](src/components/topic-hub/TopicSummaryHeader.jsx) | Composes the hub; owns accordion state (persisted per topic) |
| [QuickNavBar.jsx](src/components/topic-hub/QuickNavBar.jsx) | Sticky Category › Subject › Topic, today's attempts ring, streak, language |
| [ConceptSection.jsx](src/components/topic-hub/ConceptSection.jsx) | Accessible accordion panel (`aria-expanded`, `inert` when closed) |
| [ConceptCards.jsx](src/components/topic-hub/ConceptCards.jsx) | Formula, rule, trick and pitfall cards |
| [ModeCtaBar.jsx](src/components/topic-hub/ModeCtaBar.jsx) | Continuous Practice / Timed Mock toggle + 10/20/50 presets |
| [Localized.jsx](src/components/topic-hub/Localized.jsx) | `<Localized>`, `<MathMarkdown>` (Markdown + KaTeX), `<Tex>` |
| [useLanguagePreference.js](src/hooks/useLanguagePreference.js) | Language state, localStorage, cross-tab sync, scroll preservation |
| [usePersistentState.js](src/hooks/usePersistentState.js) | Generic persisted state (accordion, CTA mode, mock length) |
| [useStudyProgress.js](src/hooks/useStudyProgress.js) | On-device attempts-today and streak |

## Practice Arena

```jsx
import PracticeArena from './components/practice/PracticeArena';
import { createHttpPracticeSource } from './lib/practiceSource';

const source = useMemo(() => createHttpPracticeSource({ category, subject, topic }), [category, subject, topic]);

<PracticeArena
  source={source}                         // or createFixturePracticeSource(practiceBank)
  topicName={breadcrumb.topic.name}       // localized, for the milestone message
  onLaunchMock={({ questionCount, timeLimitMinutes }) => ...}
  onActiveChange={setArenaActive}         // pass to <TopicSummaryHeader ctaHidden>
/>
```

| File | Role |
|---|---|
| [PracticeArena.jsx](src/components/practice/PracticeArena.jsx) | Composition, focus/scroll choreography, announcements |
| [practiceReducer.js](src/features/practice/practiceReducer.js) | Pure state machine: `loading → answering → checking → revealed → (next)` |
| [usePracticeSession.js](src/hooks/usePracticeSession.js) | Cursor feed with prefetch, instant validation, optimistic bookmarks |
| [useArenaKeyboard.js](src/hooks/useArenaKeyboard.js) | A–D / 1–4, ↑↓, Enter (check, then next), →, S (bookmark) |
| [OptionButton.jsx](src/components/practice/OptionButton.jsx) | Option states: idle, selected, correct (pop + burst), wrong (shake), answer, dimmed |
| [FeedbackPanel.jsx](src/components/practice/FeedbackPanel.jsx) | Verdict, "Where you made the mistake", steps, shortcut |
| [MilestoneDialog.jsx](src/components/practice/MilestoneDialog.jsx) / [ReportDialog.jsx](src/components/practice/ReportDialog.jsx) | Native `<dialog>`: focus trap and Esc built in |

Behaviour:

- **Prefetching:** the next page loads while two or more questions remain, so "Next" never waits on the network.
- **Milestone timing:** the milestone appears on the *Next* after every 10th answer, so the explanation is read first. It says "mastered" only at 80%+ accuracy, otherwise "solved".
- **Daily tracker:** each checked answer also feeds the nav bar's "today" ring.
- **Keyboard scope:** shortcuts work only while the arena crosses the middle of the screen and no dialog is open. They're ignored while typing.
- **CTA bar:** the hub's bottom CTA bar slides away while the arena (with its own progress bar) is on screen.
- **Reloads:** session counters (`5/20`, accuracy) live in memory and reset on reload. The daily count and streak persist.

## Mock test (CBT engine)

"Launch mock test" (hub CTA), the arena's **Mock Test** button and the 10-question
milestone all open [MockSetupDialog](src/components/mock/MockSetupDialog.jsx):

- **Questions:** 10 / 25 / 50 / 100.
- **Scope:** this topic or the whole subject.
- **Timer:** overall (10–120 min) or per question (30–90 s).
- **Pause:** allowed or not.
- **Language:** English or বাংলা.

If the pool is too small, the dialog says how many questions exist and offers
"Start with N" or "Whole subject".

Starting creates the server session and opens `/mock/:sessionId`:

| File | Role |
|---|---|
| [MockTestEngine.jsx](src/components/mock/MockTestEngine.jsx) | Top bar (name, live timer, pause, EN/BN, submit), question, Clear Response / Mark for Review & Next / Save & Next |
| [QuestionPalette.jsx](src/components/mock/QuestionPalette.jsx) | Status palette: sidebar on desktop, drawer on phones |
| [useExamTimer.js](src/hooks/useExamTimer.js) | Deadline-based countdown: start, pause, resume, tick and expiry callbacks, localStorage recovery |
| [mockExamReducer.js](src/features/mock/mockExamReducer.js) | Pure CBT state machine |
| [examStore.js](src/lib/examStore.js) | IndexedDB persistence, sessionStorage fallback |
| [MockTestPage.jsx](src/pages/MockTestPage.jsx) | Restores on load: device copy, then server session, then result |

CBT rules (as on the SSC / IBPS / NTA screens):

- **Saving:** a selection counts only after **Save & Next** or **Mark for Review & Next**. Jumping to another question from the palette discards an unsaved selection.
- **Palette:** gray = not visited, red = visited but not answered, green = answered, purple = marked, purple + green dot = answered & marked. Answered & marked questions **are** evaluated. Shapes differ too, so red/green colour-blind students can tell them apart.
- **Per-question mode:** the test is linear. A question locks when it is saved or its time runs out (the current selection is kept). The test submits after the last one.
- **Auto-submit:** at 00:00:00 the test submits. The timer turns red under 5 minutes (under 10 s per question), and screen readers hear "5 minutes left" and "1 minute left".
- **Pausing:** pause hides the question and stops the clock, when the test allows it.

Refresh resilience:

- **The clock:** the timer stores the deadline (`endsAt`), not "seconds left". A reload resumes at the true remaining time, and the clock keeps running while the page is closed. If the deadline passed meanwhile, the test auto-submits on load. Non-pausable tests end at the server's deadline.
- **Answers:** answers, marks, position and per-question time are mirrored to IndexedDB on every change. Time still buffered at unload goes to localStorage, because IndexedDB writes during page unload often don't finish.
- **Verified:** in Chrome, a reload mid-test restored question 5 of 25 with every palette state, and the timer read 00:19:56 → 00:19:54 across the reload.

Keyboard: A–D / 1–4 choose, Enter = Save & Next, M = Mark for Review & Next.

Local development: mock sessions need a user. Dev builds send `VITE_DEV_USER_ID` as `x-user-id` (see `.env.example`); production backends ignore it.

## Result & performance analytics

After a mock test is submitted, `/mock/:sessionId` shows
[TestAnalyticsDashboard](src/components/analytics/TestAnalyticsDashboard.jsx) (data:
`GET /mock/session/:id/analytics`):

- **Summary:** score, percentile and rank among comparable tests (hidden until 5 exist), accuracy, and time per question against target.
- **Cut-off check:** your score against official cut-offs as a share of full marks, each with a link to its source. Cut-offs come only from `backend/db/seed/cutoffs.js`, which ships **empty**: add real figures with their notice URL. Until then the card says none have been added.
- **Charts** ([charts.jsx](src/components/analytics/charts.jsx), plain SVG/Tailwind): answer breakdown, accuracy by topic, and time per question with a target tick (click a bar to jump to that question).
  - Red/green is not distinguishable for deuteranopes (validated: ΔE 4.1), so incorrect bars are hatched, unattempted ones outlined, and legends carry icons and labels.
- **Retention hooks:**
  - "Practice 15 *weakest topic* questions" opens `?practice=15` on that topic.
  - "Start retry" opens `/mock/:sessionId/retry`: a 5-question round in the Practice Arena, built by [retryQuiz.js](src/features/analytics/retryQuiz.js):
    - wrong answers first, then blanks;
    - round-robin across topics, weakest first;
    - within a topic, the question you spent longest on first;
    - options reshuffled.
- **Review matrix** ([ReviewMatrix.jsx](src/components/analytics/ReviewMatrix.jsx)): filters for All / Incorrect / Unattempted / Marked for review, explanations in English, বাংলা or both side by side, the shortcut highlighted, and the trap note for the option you picked.

## How the language switch works

`<Localized value={{ en, bn, hi }}>` renders each available language once, as
sibling elements tagged `data-l="en"` (or `data-l="en hi"` when Hindi falls back
to English). The active language is the `data-ui-lang` attribute on `<html>`,
and CSS hides the other slots. So a switch is one attribute write:

- content components don't re-render, and KaTeX doesn't re-typeset (a test checks this with React's Profiler);
- accordion state and DOM nodes are untouched;
- the hook finds the block nearest the sticky bar before the switch and scrolls to cancel its movement after it, since Bengali and Devanagari set taller than Latin. Measured in Chrome at 390 px width: 0.1 px of drift.

An inline script in `index.html` applies the saved language before first paint.

Untranslated blocks show the English text with a small "EN" badge.

Use `useLanguagePreference()` only where the current language must be *read*:
the switcher, or the payload for `create-session`.

## Notes

- Use `\frac` for fractions inside running text and `\dfrac` only in display formulas (the `latex` field). `\dfrac` inline doubles the line height.
- Bundle: about 277 KB gzipped, mostly KaTeX and the Markdown pipeline. If that matters on low-end phones, render Markdown + KaTeX to HTML at publish time on the backend, and ship only `katex.min.css`.
- `npm audit` reports one low-severity KaTeX advisory. It only applies with KaTeX's `trust` option, which this code never enables.
