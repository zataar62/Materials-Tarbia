(() => {
  const grid = document.getElementById('examsGrid');
  const resultsBox = document.getElementById('examResults');
  if (!grid) return;
  const config = window.MATERIALS_CONFIG;
  const demo = !config || !config.supabaseUrl || config.supabaseUrl.includes('YOUR-');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let client = null;
  let exams = [];
  const profile = () => { try { return JSON.parse(localStorage.getItem('materials-visitor-profile') || 'null'); } catch (_) { return null; } };
  const message = text => { grid.innerHTML = `<div class="exam-empty">${escape(text)}</div>`; };
  async function load() {
    if (demo) { try { exams = JSON.parse(localStorage.getItem('materials-demo-exams') || '[]'); } catch (_) { exams = []; } render(); loadResults(); return; }
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const result = await client.from('exams').select('id,title,subject,year,description,created_at').eq('published', true).order('created_at', { ascending: false });
    if (result.error) return message('تعذر تحميل الامتحانات. شغّل جزء الامتحانات من ملف supabase-schema.sql.');
    exams = result.data || []; render(); loadResults();
  }
  function render() {
    if (!exams.length) return message('لا توجد امتحانات منشورة حاليًا.');
    grid.innerHTML = exams.map(exam => `<article class="exam-card"><div class="exam-card-mark">✓</div><div class="exam-card-content"><span>الفرقة ${escape(exam.year)} · ${escape(exam.subject)}</span><h3>${escape(exam.title)}</h3><p>${escape(exam.description || 'اختبار إلكتروني للمراجعة وقياس مستواك.')}</p></div><div class="exam-actions"><button class="exam-start" data-exam="${escape(exam.id)}" type="button">ابدأ الامتحان <b>←</b></button><button class="exam-ranking" data-ranking="${escape(exam.id)}" type="button">ترتيب الأوائل</button></div></article>`).join('');
    grid.querySelectorAll('[data-exam]').forEach(btn => btn.onclick = () => openExam(btn.dataset.exam));
    grid.querySelectorAll('[data-ranking]').forEach(btn => btn.onclick = () => openLeaderboard(btn.dataset.ranking));
  }
  async function openExam(id) {
    const exam = exams.find(item => String(item.id) === String(id)); if (!exam) return;
    let questions = [];
    if (demo) questions = exam.questions || [];
    else { const result = await client.from('exam_questions').select('id,question_text,option_a,option_b,option_c,option_d,points,order_no').eq('exam_id', id).order('order_no'); if (result.error) return alert('تعذر تحميل أسئلة الامتحان.'); questions = result.data || []; }
    if (!questions.length) return alert('هذا الامتحان لا يحتوي على أسئلة بعد.');
    const visitor = profile(); if (!visitor?.email || !visitor?.name) return alert('سجّل بياناتك أولًا حتى يتم حفظ نتيجتك.');
    const modal = document.createElement('div'); modal.className = 'exam-modal'; modal.innerHTML = `<div class="exam-dialog" role="dialog" aria-modal="true" aria-labelledby="examDialogTitle"><div class="exam-dialog-head"><div><span class="eyebrow">امتحان إلكتروني</span><h2 id="examDialogTitle">${escape(exam.title)}</h2><p>${escape(exam.subject)} · ${questions.length} سؤال</p></div><button class="exam-close" type="button" aria-label="إغلاق">×</button></div><form class="exam-solve-form"><div class="exam-question-list">${questions.map((q, i) => `<fieldset class="exam-question"><legend><b>${i + 1}</b> ${escape(q.question_text)}</legend>${[['a',q.option_a],['b',q.option_b],['c',q.option_c],['d',q.option_d]].map(([key,text]) => `<label><input type="radio" name="q-${escape(q.id || i)}" value="${key}"><span>${escape(text)}</span></label>`).join('')}</fieldset>`).join('')}</div><div class="exam-dialog-footer"><p class="exam-submit-message" aria-live="polite"></p><button class="exam-submit" type="submit">تسليم الامتحان <b>←</b></button></div></form></div>`;
    document.body.appendChild(modal); const close = () => modal.remove(); modal.querySelector('.exam-close').onclick = close; modal.onclick = e => { if (e.target === modal) close(); };
    modal.querySelector('form').onsubmit = async event => { event.preventDefault(); const answers = {}; questions.forEach((q, i) => { const selected = modal.querySelector(`input[name="q-${CSS.escape(String(q.id || i))}"]:checked`); if (selected) answers[q.id || i] = selected.value; }); if (Object.keys(answers).length < questions.length && !confirm('لم تجب عن كل الأسئلة. هل تريد التسليم؟')) return; const submit = modal.querySelector('.exam-submit'); const msg = modal.querySelector('.exam-submit-message'); submit.disabled = true; msg.textContent = 'جارٍ تصحيح الإجابات...'; try { let result; if (demo) { const score = questions.reduce((sum,q) => sum + (answers[q.id || questions.indexOf(q)] === q.correct_option ? Number(q.points || 1) : 0), 0); result = { score, total_points: questions.reduce((sum,q) => sum + Number(q.points || 1), 0) }; const attempts = JSON.parse(localStorage.getItem('materials-demo-attempts') || '[]'); attempts.push({ ...result, exam_id: id, visitor_email: profile().email, visitor_name: profile().name, submitted_at: new Date().toISOString() }); localStorage.setItem('materials-demo-attempts', JSON.stringify(attempts)); } else { const rpc = await client.rpc('submit_exam_attempt', { p_exam_id: id, p_visitor_email: profile().email, p_visitor_name: profile().name, p_answers: answers }); if (rpc.error) throw rpc.error; result = rpc.data?.[0]; } close(); showResult(exam, result); loadResults(); } catch (error) { msg.textContent = error.message || 'تعذر تسليم الامتحان.'; submit.disabled = false; } };
  }
  async function openLeaderboard(id) {
    const exam = exams.find(item => String(item.id) === String(id)); if (!exam) return;
    let rows = [];
    if (demo) { try { rows = JSON.parse(localStorage.getItem('materials-demo-attempts') || '[]').filter(row => row.exam_id === id).sort((a,b) => b.score - a.score).filter((row, i, arr) => arr.findIndex(x => x.visitor_email === row.visitor_email) === i).slice(0, 20); } catch (_) {} }
    else { const result = await client.rpc('get_exam_leaderboard', { p_exam_id: id }); if (result.error) return alert('تعذر تحميل ترتيب الأوائل.'); rows = result.data || []; }
    const modal = document.createElement('div'); modal.className = 'exam-modal'; modal.innerHTML = `<div class="exam-dialog ranking-dialog" role="dialog" aria-modal="true"><div class="exam-dialog-head"><div><span class="eyebrow">النتائج</span><h2>ترتيب أوائل ${escape(exam.title)}</h2><p>أفضل نتيجة محفوظة لكل زائر</p></div><button class="exam-close" type="button">×</button></div>${rows.length ? `<div class="ranking-list">${rows.map((row, i) => `<div class="ranking-row"><b>${escape(row.rank || i + 1)}</b><strong>${escape(row.visitor_name)}</strong><span>${escape(row.score)} / ${escape(row.total_points)}</span></div>`).join('')}</div>` : '<div class="exam-empty">لم يسلم أحد هذا الامتحان حتى الآن.</div>'}</div>`; document.body.appendChild(modal); modal.querySelector('.exam-close').onclick = () => modal.remove(); modal.onclick = event => { if (event.target === modal) modal.remove(); };
  }
  function showResult(exam, result) { const percent = result.total_points ? Math.round((result.score / result.total_points) * 100) : 0; const box = document.createElement('div'); box.className = 'result-toast'; box.innerHTML = `<strong>نتيجتك في ${escape(exam.title)}</strong><span>${escape(result.score)} من ${escape(result.total_points)} درجة · ${percent}%</span><button type="button">حسنًا</button>`; document.body.appendChild(box); box.querySelector('button').onclick = () => box.remove(); }
  async function loadResults() { const visitor = profile(); if (!visitor?.email) { resultsBox.hidden = true; return; } let rows = []; if (demo) { try { rows = JSON.parse(localStorage.getItem('materials-demo-attempts') || '[]').filter(row => row.visitor_email === visitor.email); } catch (_) {} } else { const result = await client.rpc('get_my_exam_results', { p_visitor_email: visitor.email }); if (result.error) return; rows = result.data || []; } resultsBox.hidden = !rows.length; if (rows.length) resultsBox.innerHTML = `<div class="results-head"><div><span class="eyebrow">حسابي</span><h3>نتائج امتحاناتي</h3></div></div><div class="results-list">${rows.slice(0,10).map(row => `<div class="result-row"><strong>${escape(row.exam_title || exams.find(e => e.id === row.exam_id)?.title || 'امتحان')}</strong><span>${escape(row.score)} / ${escape(row.total_points)}</span></div>`).join('')}</div>`; }
  load();
  window.addEventListener('visitor-profile-ready', loadResults);
})();
