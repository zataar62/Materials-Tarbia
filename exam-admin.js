(() => {
  const form = document.getElementById('examForm');
  if (!form) return;
  const config = window.MATERIALS_CONFIG;
  const demo = !config || !config.supabaseUrl || config.supabaseUrl.includes('YOUR-');
  const subjects = ['كيمياء عامة (2)','طحالب + تصنيف نبات B','تطبيقات الفيزياء في الحياة','كهرومغناطيسية','تدريس مصغر (2)','تطبيقات الرياضيات في الحياة','قضايا مجتمعية','الاتجاهات المعاصرة في علم نفس','دمج ذوي الاحتياجات الخاصة','كيمياء الجزيئات الحيوية','خبرات دولية في تطوير المناهج','نظريات تربوية وإدارية','المهارات الحياتية','القوة الإيجابية في الشخصية'];
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let client = null;
  function notify(text, good = false) { $('examFormMessage').textContent = text || ''; $('examFormMessage').style.color = good ? 'var(--success)' : ''; }
  function addQuestion(data = {}) {
    const n = document.querySelectorAll('.question-editor').length + 1;
    const box = document.createElement('article'); box.className = 'question-editor';
    box.innerHTML = `<div class="question-editor-head"><strong>السؤال ${n}</strong><button type="button" class="remove-question ghost">حذف</button></div><label>نص السؤال<textarea class="q-text" required rows="2" placeholder="اكتب السؤال هنا">${escape(data.question_text)}</textarea></label><div class="options-grid"><label>أ <input class="q-a" required value="${escape(data.option_a)}"></label><label>ب <input class="q-b" required value="${escape(data.option_b)}"></label><label>ج <input class="q-c" required value="${escape(data.option_c)}"></label><label>د <input class="q-d" required value="${escape(data.option_d)}"></label></div><div class="question-footer"><label>الإجابة الصحيحة<select class="q-correct"><option value="a">أ</option><option value="b">ب</option><option value="c">ج</option><option value="d">د</option></select></label><label>الدرجة<input class="q-points" type="number" min="1" max="100" value="${data.points || 1}"></label></div>`;
    box.querySelector('.q-correct').value = data.correct_option || 'a';
    box.querySelector('.remove-question').onclick = () => { box.remove(); renumber(); };
    $('questionsBuilder').appendChild(box);
  }
  function renumber() { document.querySelectorAll('.question-editor-head strong').forEach((el, i) => el.textContent = `السؤال ${i + 1}`); }
  function readQuestions() { return [...document.querySelectorAll('.question-editor')].map((box, i) => ({ question_text: box.querySelector('.q-text').value.trim(), option_a: box.querySelector('.q-a').value.trim(), option_b: box.querySelector('.q-b').value.trim(), option_c: box.querySelector('.q-c').value.trim(), option_d: box.querySelector('.q-d').value.trim(), correct_option: box.querySelector('.q-correct').value, points: Number(box.querySelector('.q-points').value) || 1, order_no: i + 1 })); }
  function resetForm() { form.reset(); $('examPublished').checked = true; $('examSubject').value = subjects[0]; $('questionsBuilder').innerHTML = ''; addQuestion(); }
  async function load() {
    if (demo) { let rows = []; try { rows = JSON.parse(localStorage.getItem('materials-demo-exams') || '[]'); } catch (_) {} render(rows); return; }
    if (!client) client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const result = await client.from('exams').select('id,title,subject,year,published,created_at,exam_questions(id)').order('created_at', { ascending: false });
    if (result.error) { $('examsAdminList').innerHTML = '<div class="empty">شغّل جزء الامتحانات من ملف supabase-schema.sql أولًا.</div>'; return; }
    render(result.data || []);
  }
  function render(rows) { $('examsAdminCount').textContent = `${rows.length} امتحان`; $('examsAdminList').innerHTML = rows.length ? rows.map(row => `<article class="exam-admin-row"><div><strong>${escape(row.title)}</strong><small>الفرقة ${row.year} · ${escape(row.subject)} · ${row.exam_questions?.length || row.question_count || 0} سؤال · ${row.published ? 'منشور' : 'مسودة'}</small></div><button class="material-actions delete exam-delete" data-id="${escape(row.id)}" type="button">حذف</button></article>`).join('') : '<div class="empty">لم تتم إضافة امتحانات حتى الآن.</div>'; document.querySelectorAll('.exam-delete').forEach(btn => btn.onclick = () => removeExam(btn.dataset.id)); }
  async function removeExam(id) { if (!confirm('حذف الامتحان وكل أسئلته ونتائجه؟ لا يمكن التراجع.')) return; if (demo) { let rows = JSON.parse(localStorage.getItem('materials-demo-exams') || '[]').filter(row => row.id !== id); localStorage.setItem('materials-demo-exams', JSON.stringify(rows)); return load(); } const result = await client.from('exams').delete().eq('id', id); if (result.error) return notify(result.error.message); notify('تم حذف الامتحان.', true); load(); }
  $('examSubject').innerHTML = subjects.map(s => `<option>${escape(s)}</option>`).join('');
  $('addQuestionButton').onclick = () => addQuestion();
  form.onsubmit = async event => { event.preventDefault(); const questions = readQuestions(); if (!questions.length) return notify('أضف سؤالًا واحدًا على الأقل.'); if (questions.some(q => !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d)) return notify('أكمل نص السؤال وكل الاختيارات.'); const exam = { title: $('examTitle').value.trim(), subject: $('examSubject').value, year: Number($('examYear').value), description: $('examDescription').value.trim(), published: $('examPublished').checked }; if (!exam.title) return notify('اكتب عنوان الامتحان.'); notify('جارٍ حفظ الامتحان...', false); try { if (demo) { const rows = JSON.parse(localStorage.getItem('materials-demo-exams') || '[]'); rows.unshift({ ...exam, id: crypto.randomUUID(), questions }); localStorage.setItem('materials-demo-exams', JSON.stringify(rows)); } else { const created = await client.from('exams').insert(exam).select('id').single(); if (created.error) throw created.error; const payload = questions.map(q => ({ ...q, exam_id: created.data.id })); const inserted = await client.from('exam_questions').insert(payload); if (inserted.error) { await client.from('exams').delete().eq('id', created.data.id); throw inserted.error; } } resetForm(); notify('تم حفظ الامتحان والأسئلة بنجاح.', true); load(); } catch (error) { notify(error.message || 'تعذر حفظ الامتحان.'); } };
  addQuestion(); load();
})();
