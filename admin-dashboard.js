(() => {
  const config = window.MATERIALS_CONFIG;
  const demoMode = !config || !config.supabaseUrl || config.supabaseUrl.includes('YOUR-');
  const subjects = { 1: ['اختر المادة'], 2: ['كيمياء عامة (2)', 'طحالب + تصنيف نبات B', 'تطبيقات الفيزياء في الحياة', 'كهرومغناطيسية', 'تدريس مصغر (2)', 'تطبيقات الرياضيات في الحياة', 'قضايا مجتمعية', 'الاتجاهات المعاصرة في علم نفس', 'دمج ذوي الاحتياجات الخاصة', 'كيمياء الجزيئات الحيوية', 'خبرات دولية في تطوير المناهج', 'نظريات تربوية وإدارية', 'المهارات الحياتية', 'القوة الإيجابية في الشخصية'] };
  const $ = id => document.getElementById(id);
  const state = { rows: JSON.parse(localStorage.getItem('materials-demo-rows') || '[]') };
  let client = null;
  if (demoMode) {
    if (sessionStorage.getItem('materials-demo-session') !== 'active') { location.href = 'admin.html'; return; }
  } else {
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    client.auth.getSession().then(({ data }) => data.session ? start() : (location.href = 'admin.html'));
  }

  function start() {
    $('appView').hidden = false;
    setSubjects();
    loadRows();
  }
  function setSubjects() {
    const year = $('year').value;
    const names = [...new Set(subjects[year] || [])];
    $('subject').innerHTML = names.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
    updateCustomSubject();
  }
  function updateCustomSubject() {
    const selectedName = $('subject').value.trim();
    const combined = selectedName.includes('طحالب') && selectedName.includes('تصنيف نبات');
    $('partWrap').hidden = !combined;
    $('part').required = combined;
    if (!combined) $('part').value = '';
  }
  function selectedSubject() { return $('subject').value.trim(); }
  function notify(text, good = false) { $('formMessage').textContent = text; $('formMessage').style.color = good ? 'var(--success)' : ''; }
  function render() {
    const term = ($('adminSearch').value || '').toLowerCase().trim();
    const filtered = state.rows.filter(row => `${row.title} ${row.subject} ${row.part || ''}`.toLowerCase().includes(term));
    $('totalCount').textContent = state.rows.length;
    $('year1Count').textContent = state.rows.filter(row => row.year === 1).length;
    $('year2Count').textContent = state.rows.filter(row => row.year === 2).length;
    $('materialsList').innerHTML = filtered.length ? filtered.map(row => `<article class="material-row"><span class="material-icon">${escapeHTML(row.format)}</span><div class="material-info"><strong>${escapeHTML(row.title)}</strong><small>الفرقة ${row.year} · ${escapeHTML(row.subject)}${row.part ? ` · الجزء: ${escapeHTML(row.part)}` : ''} · ${escapeHTML(row.type)}</small></div><div class="material-actions"><a href="${escapeHTML(window.fileActions.getPreviewUrl(row))}" target="_blank" rel="noopener">معاينة</a><button class="delete" data-delete="${row.id}" type="button">حذف</button></div></article>`).join('') : '<div class="empty">لا توجد ملفات مضافة حتى الآن.</div>';
    document.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => removeMaterial(button.dataset.delete));
  }
  function persist() { localStorage.setItem('materials-demo-rows', JSON.stringify(state.rows)); }
  async function loadRows() {
    if (demoMode) { render(); return; }
    const { data, error } = await client.from('materials').select('*').order('created_at', { ascending: false });
    if (error) return notify(error.message);
    state.rows = data || [];
    render();
  }
  async function removeMaterial(id) {
    if (!confirm('هل تريد حذف هذا الملف؟')) return;
    if (demoMode) { state.rows = state.rows.filter(row => row.id !== id); persist(); render(); notify('تم حذف الملف التجريبي.', true); return; }
    const row = state.rows.find(item => item.id === id);
    const { error } = await client.from('materials').delete().eq('id', id);
    if (error) return notify(error.message);
    if (row?.file_path) await client.storage.from('materials').remove([row.file_path]);
    await loadRows(); notify('تم حذف الملف.', true);
  }
  $('logoutButton').onclick = async () => { if (client) await client.auth.signOut(); sessionStorage.removeItem('materials-demo-session'); location.href = 'admin.html'; };
  $('year').onchange = setSubjects;
  $('subject').onchange = updateCustomSubject;
  $('adminSearch').oninput = render;
  $('file').onchange = event => { if (event.target.files[0]) $('fileLabel').textContent = event.target.files[0].name; };
  $('materialForm').onsubmit = async event => {
    event.preventDefault();
    const file = $('file').files[0];
    const driveUrl = $('driveUrl').value.trim();
    const subject = selectedSubject();
    if (!subject || subject === 'اختر المادة') return notify('اختر مادة من القائمة.');
    if (!file && !driveUrl) return notify('اختر ملفًا أو الصق رابط Google Drive.');
    if (driveUrl && !/^https?:\/\/(?:drive\.google\.com|docs\.google\.com)\//i.test(driveUrl)) return notify('ضع رابط مشاركة صحيح من Google Drive.');
    if (file && file.size > 50 * 1024 * 1024) return notify('حجم الملف أكبر من 50MB.');
    $('submitLabel').textContent = 'جارٍ الرفع...';
    const base = { year: Number($('year').value), subject, part: $('part').value || null, title: $('title').value.trim(), type: $('type').value, format: file ? (file.type === 'application/pdf' ? 'PDF' : (file.type.startsWith('video/') ? 'فيديو' : 'صورة')) : $('driveFormat').value, published: $('published').checked };
    if (demoMode) {
      const id = crypto.randomUUID();
      if (file) {
        const db = await openFileDb();
        await putFile(db, id, file);
      }
      state.rows.unshift({ ...base, id, file_key: file ? id : '', file_url: driveUrl });
      persist();
      resetForm();
      render();
      notify('تمت إضافة الملف والمادة في وضع التجربة. افتح الموقع أو حدّثه لرؤيته.', true);
      return;
    }
    let fileUrl = driveUrl;
    let filePath = null;
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      const safeName = `${crypto.randomUUID()}.${ext}`;
      const path = `${base.year}/${safeName}`;
      const upload = await client.storage.from('materials').upload(path, file, { upsert: false, contentType: file.type, cacheControl: '3600' });
      if (upload.error) { $('submitLabel').textContent = 'رفع ونشر الملف'; return notify(upload.error.message); }
      const { data: publicData } = client.storage.from('materials').getPublicUrl(path);
      fileUrl = publicData.publicUrl;
      filePath = path;
    }
    const { error } = await client.from('materials').insert({ ...base, file_url: fileUrl, file_path: filePath });
    if (error) { if (filePath) await client.storage.from('materials').remove([filePath]); $('submitLabel').textContent = 'رفع ونشر الملف'; return notify(error.message); }
    resetForm(); await loadRows(); notify('تم رفع الملف ونشره للطلاب.', true);
  };
  function resetForm() { $('materialForm').reset(); $('published').checked = true; $('driveFormat').value = 'PDF'; setSubjects(); $('fileLabel').textContent = 'اسحب الملف هنا أو اضغط للاختيار'; $('submitLabel').textContent = 'رفع ونشر الملف'; }
  function openFileDb() { return new Promise((resolve, reject) => { const request = indexedDB.open('materials-demo-files', 1); request.onupgradeneeded = () => request.result.createObjectStore('files'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
  function putFile(db, key, file) { return new Promise((resolve, reject) => { const request = db.transaction('files', 'readwrite').objectStore('files').put(file, key); request.onsuccess = resolve; request.onerror = () => reject(request.error); }); }
  function slugify(value) { return String(value || 'file').trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}\-_]/gu, '').slice(0, 100) || 'file'; }
  if (demoMode) { const notice = document.createElement('div'); notice.textContent = 'وضع تجربة مؤقت — البيانات محفوظة على هذا المتصفح فقط'; notice.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:20;background:#fff4cf;color:#8d6b31;border:1px solid #ead9b2;border-radius:999px;padding:8px 14px;font:700 11px Cairo,sans-serif;box-shadow:0 8px 22px #102b4615'; document.body.appendChild(notice); start(); }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
})();
