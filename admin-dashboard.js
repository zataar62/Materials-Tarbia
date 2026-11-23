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
    const combined = selectedName === 'طحالب + تصنيف نبات B';
    const sectioned = ['كيمياء عامة (2)', 'كهرومغناطيسية', 'كيمياء الجزيئات الحيوية'].includes(selectedName) || (combined && !!$('part').value);
    $('partWrap').hidden = !combined;
    $('part').required = combined;
    $('sectionWrap').hidden = !sectioned;
    if (!combined) $('part').value = '';
    if (!sectioned) $('section').value = 'المحاضرات';
  }

  function selectedSubject() { return $('subject').value.trim(); }
  function notify(text, good = false) { $('formMessage').textContent = text || ''; $('formMessage').style.color = good ? 'var(--success)' : ''; }
  function setProgress(percent, label) {
    const value = Math.max(0, Math.min(100, Math.round(percent)));
    $('uploadProgress').hidden = false;
    $('progressBar').style.width = `${value}%`;
    $('progressPercent').textContent = `${value}%`;
    $('progressLabel').textContent = label;
  }
  function hideProgress() {
    $('uploadProgress').hidden = true;
    $('progressBar').style.width = '0%';
    $('progressPercent').textContent = '0%';
  }
  function uploadToStorage(path, file) {
    return new Promise(async (resolve, reject) => {
      const { data: sessionData } = await client.auth.getSession();
      const token = sessionData?.session?.access_token;
      const request = new XMLHttpRequest();
      request.open('POST', `${config.supabaseUrl}/storage/v1/object/materials/${path}`);
      request.setRequestHeader('Authorization', `Bearer ${token}`);
      request.setRequestHeader('apikey', config.supabaseAnonKey);
      request.setRequestHeader('x-upsert', 'false');
      request.setRequestHeader('cache-control', '3600');
      request.setRequestHeader('content-type', file.type || 'application/octet-stream');
      request.upload.onprogress = event => {
        if (event.lengthComputable) setProgress((event.loaded / event.total) * 85, 'جارٍ رفع الملف...');
      };
      request.onload = () => request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`فشل رفع الملف (${request.status})`));
      request.onerror = () => reject(new Error('تعذر الاتصال أثناء رفع الملف.'));
      request.onabort = () => reject(new Error('تم إلغاء رفع الملف.'));
      request.send(file);
    });
  }
  function isDriveLink(value) { return /^https?:\/\/(?:drive\.google\.com|docs\.google\.com)\//i.test(String(value || '').trim()); }

  function isStandaloneClassification(row) { return row && row.subject === 'تصنيف نبات B'; }

  function render() {
    const term = ($('adminSearch').value || '').toLowerCase().trim();
    const filtered = state.rows.filter(row => !isStandaloneClassification(row) && `${row.title} ${row.subject} ${row.section || ''}`.toLowerCase().includes(term));
    $('totalCount').textContent = state.rows.filter(row => !isStandaloneClassification(row)).length;
    $('year1Count').textContent = state.rows.filter(row => !isStandaloneClassification(row) && row.year === 1).length;
    $('year2Count').textContent = state.rows.filter(row => !isStandaloneClassification(row) && row.year === 2).length;
    $('materialsList').innerHTML = filtered.length ? filtered.map(row => `<article class="material-row"><span class="material-icon">${escapeHTML(row.format)}</span><div class="material-info"><strong>${escapeHTML(row.title)}</strong><small>الفرقة ${row.year} · ${escapeHTML(row.subject)}${row.section ? ` · القسم: ${escapeHTML(row.section)}` : ''} · ${escapeHTML(row.type)}</small></div><div class="material-actions"><a href="${escapeHTML(window.fileActions.getPreviewUrl(row))}" target="_blank" rel="noopener">معاينة</a><button class="edit" data-edit="${escapeHTML(row.id)}" type="button">تعديل</button><button class="delete" data-delete="${escapeHTML(row.id)}" type="button">حذف</button></div></article>`).join('') : '<div class="empty">لا توجد ملفات مضافة حتى الآن.</div>';
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
    $('section').value = row.section || 'المحاضرات';
    $('type').value = row.type || 'محاضرات';
    $('title').value = row.title || '';
    $('driveFormat').value = row.format || 'PDF';
    $('driveUrl').value = isDriveLink(row.file_url) ? row.file_url : '';
    $('published').checked = row.published !== false;
    $('file').value = '';
    $('fileLabel').textContent = 'اتركه فارغًا للاحتفاظ بالملف الحالي أو اختر ملفًا جديدًا';
    $('submitLabel').textContent = 'حفظ التعديل';
    $('cancelEdit').hidden = false;
    notify('');
    $('materialForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('logoutButton').onclick = async () => { if (client) await client.auth.signOut(); sessionStorage.removeItem('materials-demo-session'); location.href = 'admin.html'; };
  $('year').onchange = setSubjects;
  $('subject').onchange = updateCustomSubject;
  $('part').onchange = updateCustomSubject;
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
    if (file && file.size > 100 * 1024 * 1024) return notify('حجم الملف أكبر من 100MB.');
    notify('');
    setProgress(0, editingId ? 'جارٍ تجهيز التعديل...' : 'جارٍ تجهيز الملف...');
    $('submitLabel').textContent = editingId ? 'جارٍ حفظ التعديل...' : 'جارٍ الرفع...';

    const format = file ? (file.type === 'application/pdf' ? 'PDF' : (file.type.startsWith('video/') ? 'فيديو' : 'صورة')) : (driveUrl ? $('driveFormat').value : current.format);
    const base = { year: Number($('year').value), subject, part: $('part').value || null, section: $('sectionWrap').hidden ? null : $('section').value, title: $('title').value.trim(), type: $('type').value, format, published: $('published').checked };

    if (demoMode) {
      if (editingId) {
        let updated = { ...current, ...base };
        if (file) {
          const key = crypto.randomUUID();
          setProgress(55, 'جارٍ حفظ الملف محليًا...');
          const db = await openFileDb();
          await putFile(db, key, file);
          setProgress(100, 'اكتمل رفع الملف.');
          updated = { ...updated, file_key: key, file_url: '' };
        } else if (driveUrl) {
          updated = { ...updated, file_key: '', file_url: driveUrl };
        }
        state.rows = state.rows.map(row => String(row.id) === String(editingId) ? updated : row);
        persist(); resetForm(); render(); hideProgress(); notify('تم تعديل الملف بنجاح.', true); return;
      }
      const id = crypto.randomUUID();
      if (file) {
        setProgress(55, 'جارٍ حفظ الملف محليًا...');
        const db = await openFileDb();
        await putFile(db, id, file);
        setProgress(100, 'اكتمل رفع الملف.');
      }
      state.rows.unshift({ ...base, id, file_key: file ? id : '', file_url: driveUrl });
      persist(); resetForm(); render(); hideProgress(); notify('تمت إضافة الملف في وضع التجربة.', true); return;
    }

    let fileUrl = current?.file_url || '';
    let filePath = current?.file_path || null;
    let newlyUploadedPath = null;
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `${base.year}/${crypto.randomUUID()}.${ext}`;
      let uploadError = null;
      try { await uploadToStorage(path, file); } catch (error) { uploadError = error; }
      if (uploadError) { hideProgress(); $('submitLabel').textContent = editingId ? 'حفظ التعديل' : 'رفع ونشر الملف'; return notify(uploadError.message); }
      setProgress(90, 'اكتمل رفع الملف، جارٍ نشره...');
      const { data: publicData } = client.storage.from('materials').getPublicUrl(path);
      fileUrl = publicData.publicUrl;
      newlyUploadedPath = path;
      filePath = path;
    } else if (driveUrl) {
      fileUrl = driveUrl;
      filePath = null;
    }

    const payload = { ...base, file_url: fileUrl, file_path: filePath };
    let result = editingId
      ? await client.from('materials').update(payload).eq('id', editingId)
      : await client.from('materials').insert(payload);
    // Retry once without section on installations that have not run the migration yet.
    if (result.error && /section|schema cache/i.test(result.error.message || '')) {
      const legacyPayload = { ...payload };
      delete legacyPayload.section;
      result = editingId
        ? await client.from('materials').update(legacyPayload).eq('id', editingId)
        : await client.from('materials').insert(legacyPayload);
      if (!result.error) notify('تم الحفظ. لتفعيل حفظ السكاشن نهائيًا شغّل migration-section.sql في Supabase.', true);
    }
    if (result.error) {
      if (newlyUploadedPath) await client.storage.from('materials').remove([newlyUploadedPath]);
      $('submitLabel').textContent = editingId ? 'حفظ التعديل' : 'رفع ونشر الملف';
      hideProgress();
      return notify(result.error.message);
    }
    if (editingId && current?.file_path && newlyUploadedPath && current.file_path !== newlyUploadedPath) await client.storage.from('materials').remove([current.file_path]);
    setProgress(100, 'اكتمل الرفع والنشر.');
    resetForm(); await loadRows(); hideProgress(); notify(editingId ? 'تم تعديل الملف بنجاح.' : 'تم رفع الملف ونشره للطلاب.', true);
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
