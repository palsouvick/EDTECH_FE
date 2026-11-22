import { API_BASE, ApiError, devAuthHeaders, request } from './api';

/**
 * "My course": the student's own PDFs. Thin wrappers over /course, plus an upload with
 * progress (XHR: fetch cannot report upload progress, and books are hundreds of MB).
 */
export const courseApi = {
  list: () => request('/course/files'),
  get: (id) => request(`/course/files/${id}`),
  rename: (id, title) => request(`/course/files/${id}`, { method: 'PATCH', body: { title } }),
  remove: (id) => request(`/course/files/${id}`, { method: 'DELETE' }),
  reprocess: (id, keepManual = true) => request(`/course/files/${id}/reprocess`, { method: 'POST', body: { keepManual } }),
  lastPage: (id, page) => request(`/course/files/${id}/last-page`, { method: 'PUT', body: { page } }),
  addSection: (id, body) => request(`/course/files/${id}/sections`, { method: 'POST', body }),
  updateSection: (sectionId, body) => request(`/course/sections/${sectionId}`, { method: 'PATCH', body }),
  deleteSection: (sectionId) => request(`/course/sections/${sectionId}`, { method: 'DELETE' }),
  search: (q) => request(`/course/search?${new URLSearchParams({ q })}`),
  forTopic: (subject, topic) => request(`/course/topics/${subject}/${topic}`),
  chapters: () => request('/course/chapters'),
  markPage: (id, page, body) => request(`/course/files/${id}/pages/${page}`, { method: 'PUT', body }),
  markRange: (id, body) => request(`/course/files/${id}/read`, { method: 'POST', body }),
  bookmarks: () => request('/course/bookmarks'),
  pdfUrl: (id) => `${API_BASE}/course/files/${id}/pdf`,
  pdfHeaders: devAuthHeaders,

  /** Upload one PDF; onProgress(0..1). Resolves with the new file. */
  upload(file, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/course/files`);
      xhr.withCredentials = true;
      for (const [k, v] of Object.entries(devAuthHeaders())) xhr.setRequestHeader(k, v);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () => {
        let json = null;
        try {
          json = JSON.parse(xhr.responseText);
        } catch {}
        if (xhr.status >= 200 && xhr.status < 300 && json?.success) resolve(json.data);
        else reject(new ApiError(xhr.status, json?.error?.code || 'HTTP_ERROR', json?.error?.message || `Upload failed (${xhr.status})`, json?.error?.details));
      };
      xhr.onerror = () => reject(new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection.'));
      const form = new FormData();
      form.append('file', file);
      xhr.send(form);
    });
  },
};

/**
 * A part worth a second look: matched to a chapter with low confidence, or a nameless "Other".
 * Parts from the contents page with the book's own title, and the student's own fixes, are fine.
 */
export const needsCheck = (s) => s.source !== 'manual' && ((s.topic && s.confidence < 0.4 && s.source !== 'filename') || (!s.topic && !s.label));

const t = (en, bn) => ({ en, bn });
const bnNum = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

export const COURSE = Object.freeze({
  title: t('My course', 'আমার কোর্স'),
  sub: t('Add the PDFs from your course. Each one is read page by page and split into chapters, so you can study it chapter by chapter, search everything, and see it on each chapter page. Only you can see your files.', 'তোমার কোর্সের PDF যোগ করো। প্রতিটি পাতা পড়ে অধ্যায় অনুযায়ী ভাগ করা হয়, তাই অধ্যায় ধরে পড়তে পারবে, সব PDF-এ খুঁজতে পারবে, আর প্রতিটি চ্যাপ্টার পেজেও দেখতে পাবে। তোমার ফাইল শুধু তুমিই দেখতে পাবে।'),
  add: t('Add PDF', 'PDF যোগ করো'),
  uploading: (p) => t(`Uploading… ${p}%`, `আপলোড হচ্ছে… ${bnNum(p)}%`),
  empty: t('No PDFs yet. Add your first one.', 'এখনও কোনো PDF নেই। প্রথমটি যোগ করো।'),
  searchPlaceholder: t('Search all your PDFs (e.g. চৌবাচ্চা, discount)', 'সব PDF-এ খোঁজো (যেমন চৌবাচ্চা, discount)'),
  noHits: t('Nothing found.', 'কিছু পাওয়া যায়নি।'),
  page: (n) => t(`Page ${n}`, `পাতা ${bnNum(n)}`),
  pages: (n) => t(`${n} pages`, `${bnNum(n)} পাতা`),
  pagesRange: (a, b) => t(`pages ${a}–${b}`, `পাতা ${bnNum(a)}–${bnNum(b)}`),
  status: {
    queued: t('Waiting to be read', 'পড়ার অপেক্ষায়'),
    processing: (d, n) => t(`Reading pages… ${d}/${n}`, `পাতা পড়া হচ্ছে… ${bnNum(d)}/${bnNum(n)}`),
    ready: t('Ready', 'তৈরি'),
    failed: t('Could not read this file', 'ফাইলটি পড়া যায়নি'),
  },
  kind: {
    text: t('Text PDF', 'টেক্সট PDF'),
    scanned: t('Scanned: read with OCR', 'স্ক্যান করা: OCR দিয়ে পড়া'),
    handwritten: t('Handwritten: chapter from the file name', 'হাতে লেখা: ফাইলের নাম থেকে অধ্যায়'),
    mixed: t('Text + scanned pages', 'টেক্সট + স্ক্যান করা পাতা'),
  },
  slowNote: t('Scanned books are read with OCR on this computer: about 3–6 seconds a page, so a big book takes a while. You can keep studying meanwhile.', 'স্ক্যান করা বই এই কম্পিউটারেই OCR দিয়ে পড়া হয়: পাতা প্রতি ৩–৬ সেকেন্ড, তাই বড় বইয়ে কিছুটা সময় লাগে। এর মধ্যে পড়া চালিয়ে যেতে পারো।'),
  open: t('Open', 'খোলো'),
  continueAt: (n) => t(`Continue at page ${n}`, `পাতা ${bnNum(n)} থেকে চালিয়ে যাও`),
  chapters: t('Chapters in this PDF', 'এই PDF-এর অধ্যায়'),
  other: t('Other', 'অন্যান্য'),
  fromName: t('from the file name', 'ফাইলের নাম থেকে'),
  unsure: t('check this', 'একবার দেখে নাও'),
  edit: t('Fix', 'ঠিক করো'),
  save: t('Save', 'সেভ করো'),
  cancel: t('Cancel', 'বাতিল'),
  remove: t('Remove', 'মুছে দাও'),
  addPart: t('+ Add a chapter part', '+ অধ্যায়ের অংশ যোগ করো'),
  chapterLabel: t('Chapter', 'অধ্যায়'),
  otherLabel: t('Other (name it)', 'অন্যান্য (নাম দাও)'),
  from: t('From page', 'শুরুর পাতা'),
  to: t('To page', 'শেষ পাতা'),
  prev: t('← Previous', '← আগের'),
  next: t('Next →', 'পরের →'),
  goTo: t('Go to page', 'পাতায় যাও'),
  back: t('All my PDFs', 'আমার সব PDF'),
  deleteFile: t('Delete this PDF', 'এই PDF মুছে দাও'),
  confirmDelete: t('Delete this PDF and its chapters? This cannot be undone.', 'এই PDF আর তার অধ্যায়গুলো মুছে দেবে? এটা ফেরানো যাবে না।'),
  readAgain: t('Read again', 'আবার পড়ো'),
  fromCourse: t('📘 From your course', '📘 তোমার কোর্স থেকে'),
  fromCourseSub: t('Pages from your own PDFs that cover this chapter.', 'তোমার নিজের PDF-এর যে পাতাগুলো এই অধ্যায়ের।'),
  loadingPdf: t('Loading the page…', 'পাতা লোড হচ্ছে…'),
  duplicate: (title) => t(`This PDF is already in your course as "${title}". It was not added again.`, `এই PDF আগেই তোমার কোর্সে আছে ("${title}")। আবার যোগ করা হয়নি।`),
  openExisting: t('Open it', 'সেটা খোলো'),
  readOf: (r, n) => t(`${r}/${n} pages read`, `${bnNum(r)}/${bnNum(n)} পাতা পড়া`),
  readPct: (p) => t(`${p}% read`, `${bnNum(p)}% পড়া`),
  chapterDone: t('✓ Chapter done', '✓ অধ্যায় শেষ'),
  notDone: t('Not done yet', 'এখনও শেষ হয়নি'),
  bookmark: t('Bookmark', 'বুকমার্ক'),
  bookmarked: t('Bookmarked', 'বুকমার্ক করা'),
  addNote: t('Add a note', 'নোট লেখো'),
  noteLabel: t('Your note for this page', 'এই পাতার জন্য তোমার নোট'),
  notePlaceholder: t('Your note for this page…', 'এই পাতার জন্য তোমার নোট…'),
  saveNote: t('Save note', 'নোট সেভ করো'),
  noteSaved: t('Saved ✓', 'সেভ হয়েছে ✓'),
  marksHere: t('⭐ Bookmarks & notes in this PDF', '⭐ এই PDF-এর বুকমার্ক ও নোট'),
  allMarks: t('⭐ Your bookmarks & notes', '⭐ তোমার বুকমার্ক ও নোট'),
  checkTitle: (n) => t(`⚠️ Check ${n} part${n === 1 ? '' : 's'}`, `⚠️ ${bnNum(n)}টি অংশ একবার দেখে নাও`),
  checkSub: t('The split is not sure about these. Open each one and fix it if needed.', 'এগুলোর ভাগ নিয়ে সিস্টেম নিশ্চিত নয়। একবার খুলে দেখো, দরকার হলে ঠিক করো।'),
  fromToc: t('from the contents page', 'সূচিপত্র থেকে'),
  resplit: t('Split chapters again', 'অধ্যায় আবার ভাগ করো'),
  resplitConfirm: t('Split this PDF into chapters again? Pages are not read again, so it is quick. Your own fixes in this PDF will be replaced.', 'এই PDF আবার অধ্যায়ে ভাগ করবে? পাতা আবার পড়া হবে না, তাই তাড়াতাড়ি হবে। এই PDF-এ তোমার নিজের ঠিক করা অংশ বদলে যাবে।'),
});
