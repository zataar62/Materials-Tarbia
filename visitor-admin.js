(() => {
  const panel = document.getElementById('visitorsPanel');
  const list = document.getElementById('visitorsList');
  const count = document.getElementById('visitorsCount');
  if (!panel || !list) return;
  const config = window.MATERIALS_CONFIG;
  const demo = !config || !config.supabaseUrl || config.supabaseUrl.includes('YOUR-');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatDate = value => value ? new Date(value).toLocaleString('ar-EG', { dateStyle:'medium', timeStyle:'short' }) : '—';
  let rows = [];
  let client = null;
  function render(nextRows) {
    rows = nextRows || [];
    count.textContent = `${rows.length} زائر`;
    list.innerHTML = rows.length ? rows.map(row => {
      const blocked = Boolean(row.blocked);
      return `<article class="visitor-row ${blocked ? 'is-blocked' : ''}"><div class="visitor-row-avatar">${row.gender === 'أنثى' ? 'طالبة' : 'طالب'}</div><div class="visitor-row-info"><strong>${escape(row.name)}</strong><small>${escape(row.email)} · ${escape(row.gender)}</small><small class="visitor-status ${blocked ? 'blocked' : 'active'}">${blocked ? 'محظور من الدخول' : 'حساب نشط'}</small></div><time>${formatDate(row.last_seen || row.created_at)}</time><div class="visitor-row-actions"><button class="visitor-action ${blocked ? 'unblock' : 'block'}" data-action="block" data-id="${escape(row.id)}" data-blocked="${blocked}">${blocked ? 'إلغاء الحظر' : 'حظر الطالب'}</button><button class="visitor-action delete" data-action="delete" data-id="${escape(row.id)}">حذف الحساب نهائيًا</button></div></article>`;
    }).join('') : '<div class="empty">لا توجد بيانات زائرين حتى الآن.</div>';
  }
  async function load() {
    if (demo) { try { rows = JSON.parse(localStorage.getItem('materials-visitor-profiles') || '[]'); } catch (_) { rows = []; } rows = rows.map((row, index) => ({ ...row, id: row.id || row.email || String(index) })); render(rows); return; }
    if (!client) client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const session = await client.auth.getSession();
    if (!session.data.session) return;
    const result = await client.from('visitors').select('id,name,email,gender,created_at,last_seen,blocked').order('last_seen', { ascending: false });
    if (!result.error) render(result.data || []);
    else list.innerHTML = '<div class="empty">شغّل آخر نسخة من supabase-schema.sql في Supabase ثم أعد تحميل الصفحة.</div>';
  }
  async function toggleBlock(id, currentlyBlocked) {
    const row = rows.find(item => String(item.id) === String(id));
    if (!row) return;
    const next = !currentlyBlocked;
    if (!window.confirm(next ? `هل تريد حظر ${row.name} من دخول الموقع؟` : `هل تريد إلغاء حظر ${row.name}؟`)) return;
    if (demo) { row.blocked = next; localStorage.setItem('materials-visitor-profiles', JSON.stringify(rows)); render(rows); return; }
    const result = await client.rpc('admin_set_visitor_blocked', { p_visitor_id: id, p_blocked: next });
    if (result.error) window.alert('تعذر تغيير حالة الحساب. تأكد من تشغيل آخر ملف supabase-schema.sql.'); else await load();
  }
  async function deleteVisitor(id) {
    const row = rows.find(item => String(item.id) === String(id));
    if (!row || !window.confirm(`سيتم حذف حساب ${row.name} وبياناته نهائيًا. لا يمكن التراجع. هل تريد المتابعة؟`)) return;
    if (demo) { rows = rows.filter(item => String(item.id) !== String(id)); localStorage.setItem('materials-visitor-profiles', JSON.stringify(rows)); render(rows); return; }
    const result = await client.rpc('admin_delete_visitor_account', { p_visitor_id: id });
    if (result.error) window.alert('تعذر حذف الحساب. تأكد من تشغيل آخر ملف supabase-schema.sql.'); else await load();
  }
  list.addEventListener('click', event => { const button = event.target.closest('[data-action]'); if (!button) return; if (button.dataset.action === 'block') toggleBlock(button.dataset.id, button.dataset.blocked === 'true'); if (button.dataset.action === 'delete') deleteVisitor(button.dataset.id); });
  load();
  window.setInterval(load, 15000);
})();
