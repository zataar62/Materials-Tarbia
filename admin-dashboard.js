(() => {
  const config = window.MATERIALS_CONFIG;
  const demoMode = !config || !config.supabaseUrl || config.supabaseUrl.includes('YOUR-');
  const subjects = { 1: ['اختر المادة'], 2: ['كيمياء عامة (2)', 'طحالب + تصنيف نبات B', 'تطبيقات الفيزياء في الحياة', 'كهرومغناطيسية', 'تدريس مصغر (2)', 'تطبيقات الرياضيات في الحياة', 'قضايا مجتمعية', 'الاتجاهات المعاصرة في علم نفس', 'دمج ذوي الاحتياجات الخاصة', 'كيمياء الجزيئات الحيوية', 'خبرات دولية في تطوير المناهج', 'نظريات تربوية وإدارية', 'المهارات الحياتية', 'القوة الإيجابية في الشخصية'] };
  const $ = id => document.getElementById(id);
  const state = { rows: JSON.parse(localStorage.getItem('materials-demo-rows') || '[]') };
  let client = null;
  let editingId = null;

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
  function isDriveLink(value) { return /^https?:\/\/(?:drive\.google\.com|docs\.google\.com)\//i.test(String(value || '').trim()); }

  function render() {
    const term = ($('adminSearch').value || '').toLowerCase().trim();
    const filtered = state.rows.filter(row => `${row.title} ${row.subject} ${row.part || ''}`.toLowerCase().includes(term));
    $('totalCount').textContent = state.rows.length;
    $('year1Count').textContent = state.rows.filter(row => row.year === 1).length;
    $('year2Count').textContent = state.rows.filter(row => row.year === 2).length;
    $('materialsList').innerHTML = filtered.length ? filtered.map(row => `<article class="material-row"><span class="material-icon">${escapeHTML(row.format)}</span><div class="material-info"><strong>${escapeHTML(row.title)}</strong><small>الفرقة ${row.year} · ${escapeHTML(row.subject)}${row.part ? ` · الجزء: ${escapeHTML(row.part)}` : ''} · ${escapeHTML(row.type)}</small></div><div class="material-actions"><a href="${escapeHTML(window.fileActions.getPreviewUrl(row))}" target="_blank" rel="noopener">معاينة</a><button class="edit" data-edit="${escapeHTML(row.id)}" type="button">تعديل</button><button class="delete" data-delete="${escapeHTML(row.id)}" type="button">حذف</button></div></article>`).join('') : '<div class="empty">لا توجد ملفات مضافة حتى الآن.</div>';
    document.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => removeMaterial(button.dataset.delete));
    document.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => startEdit(button.dataset.edit));
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
    if (demoMode) { state.rows = state.rows.filter(row => String(row.id) !== String(id)); persist(); render(); notify('تم حذف الملف التجريبي.', true); return; }
    const row = state.rows.find(item => String(item.id) === String(id));
    const { error } = await client.from('materials').delete().eq('id', id);
    if (error) return notify(error.message);
    if (row?.file_path) await client.storage.from('materials').remove([row.file_path]);
    await loadRows(); notify('تم حذف الملف.', true);
  }

  function startEdit(id) {
    const row = state.rows.find(item => String(item.id) === String(id));
    if (!row) return;
    editingId = id;
    $('year').value = String(row.year);
    setSubjects();
    $('subject').value = row.subject || '';
    updateCustomSubject();
    $('part').value = row.part || '';
    $('type').value = row.type || 'محاضرات';
    $('title').value = row.title || '';
    $('driveFormat').value = row.format || 'PDF';
    $('driveUrl').value = isDriveLink(row.file_url) ? row.file_url : '';
    $('published').checked = row.published !== false;
    $('file').value = '';
    $('fileLabel').textContent = 'اتركه فارغًا للاحتفاظ بالملف الحالي أو اختر ملفًا جديدًا';
    $('submitLabel').textContent = 'حفظ التعديل';
    $('cancelEdit').hidden = false;
    notify('أنت الآن تعدّل الملف المحدد. غيّر البيانات ثم اضغط حفظ التعديل.', true);
    $('materialForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('logoutButton').onclick = async () => { if (client) await client.auth.signOut(); sessionStorage.removeItem('materials-demo-session'); location.href = 'admin.html'; };
  $('year').onchange = setSubjects;
  $('subject').onchange = updateCustomSubject;
  $('adminSearch').oninput = render;
  $('file').onchange = event => { if (event.target.files[0]) $('fileLabel').textContent = event.target.files[0].name; };
  $('cancelEdit').onclick = resetForm;

  $('materialForm').onsubmit = async event => {
    event.preventDefault();
    const file = $('file').files[0];
    const driveUrl = $('driveUrl').value.trim();
    const subject = selectedSubject();
    const current = editingId ? state.rows.find(row => String(row.id) === String(editingId)) : null;
    if (!subject || subject === 'اختر المادة') return notify('اختر مادة من القائمة.');
    if (!current && !file && !driveUrl) return notify('اختر ملفًا أو الصق رابط Google Drive.');
    if (driveUrl && !isDriveLink(driveUrl)) return notify('ضع رابط مشاركة صحيح من Google Drive.');
    if (file && file.size > 50 * 1024 * 1024) return notify('حجم الملف أكبر من 50MB.');
    $('submitLabel').textContent = editingId ? 'جارٍ حفظ التعديل...' : 'جارٍ الرفع...';

    const format = file ? (file.type === 'application/pdf' ? 'PDF' : (file.type.startsWith('video/') ? 'فيديو' : 'صورة')) : (driveUrl ? $('driveFormat').value : current.format);
    const base = { year: Number($('year').value), subject, part: $('part').value || null, title: $('title').value.trim(), type: $('type').value, format, published: $('published').checked };

    if (demoMode) {
      if (editingId) {
        let updated = { ...current, ...base };
        if (file) {
          const key = crypto.randomUUID();
          const db = await openFileDb();
          await putFile(db, key, file);
          updated = { ...updated, file_key: key, file_url: '' };
        } else if (driveUrl) {
          updated = { ...updated, file_key: '', file_url: driveUrl };
        }
        state.rows = state.rows.map(row => String(row.id) === String(editingId) ? updated : row);
        persist(); resetForm(); render(); notify('تم تعديل الملف بنجاح.', true); return;
      }
      const id = crypto.randomUUID();
      if (file) {
        const db = await openFileDb();
        await putFile(db, id, file);
      }
      state.rows.unshift({ ...base, id, file_key: file ? id : '', file_url: driveUrl });
      persist(); resetForm(); render(); notify('تمت إضافة الملف في وضع التجربة.', true); return;
    }

    let fileUrl = current?.file_url || '';
    let filePath = current?.file_path || null;
    let newlyUploadedPath = null;
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `${base.year}/${crypto.randomUUID()}.${ext}`;
      const upload = await client.storage.from('materials').upload(path, file, { upsert: false, contentType: file.type, cacheControl: '3600' });
      if (upload.error) { $('submitLabel').textContent = editingId ? 'حفظ التعديل' : 'رفع ونشر الملف'; return notify(upload.error.message); }
      const { data: publicData } = client.storage.from('materials').getPublicUrl(path);
      fileUrl = publicData.publicUrl;
      newlyUploadedPath = path;
      filePath = path;
    } else if (driveUrl) {
      fileUrl = driveUrl;
      filePath = null;
    }

    const payload = { ...base, file_url: fileUrl, file_path: filePath };
    const result = editingId
      ? await client.from('materials').update(payload).eq('id', editingId)
      : await client.from('materials').insert(payload);
    if (result.error) {
      if (newlyUploadedPath) await client.storage.from('materials').remove([newlyUploadedPath]);
      $('submitLabel').textContent = editingId ? 'حفظ التعديل' : 'رفع ونشر الملف';
      return notify(result.error.message);
    }
    if (editingId && current?.file_path && newlyUploadedPath && current.file_path !== newlyUploadedPath) await client.storage.from('materials').remove([current.file_path]);
    resetForm(); await loadRows(); notify(editingId ? 'تم تعديل الملف بنجاح.' : 'تم رفع الملف ونشره للطلاب.', true);
  };

  function resetForm() {
    editingId = null;
    $('materialForm').reset();
    $('published').checked = true;
    $('driveFormat').value = 'PDF';
    $('cancelEdit').hidden = true;
    setSubjects();
    $('fileLabel').textContent = 'اسحب الملف هنا أو اضغط للاختيار';
    $('submitLabel').textContent = 'رفع ونشر الملف';
  }

  function openFileDb() { return new Promise((resolve, reject) => { const request = indexedDB.open('materials-demo-files', 1); request.onupgradeneeded = () => request.result.createObjectStore('files'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
  function putFile(db, key, file) { return new Promise((resolve, reject) => { const request = db.transaction('files', 'readwrite').objectStore('files').put(file, key); request.onsuccess = resolve; request.onerror = () => reject(request.error); }); }
  if (demoMode) { const notice = document.createElement('div'); notice.textContent = 'وضع تجربة مؤقت — البيانات محفوظة على هذا المتصفح فقط'; notice.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:20;background:#fff4cf;color:#8d6b31;border:1px solid #ead9b2;border-radius:999px;padding:8px 14px;font:700 11px Cairo,sans-serif;box-shadow:0 8px 22px #102b4615'; document.body.appendChild(notice); start(); }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
})();
