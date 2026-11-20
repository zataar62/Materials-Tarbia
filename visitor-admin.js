(() => {
  const panel = document.getElementById('visitorsPanel');
  const list = document.getElementById('visitorsList');
  const count = document.getElementById('visitorsCount');
  if (!panel || !list) return;
  const config = window.MATERIALS_CONFIG;
  const demo = !config || !config.supabaseUrl || config.supabaseUrl.includes('YOUR-');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatDate = value => value ? new Date(value).toLocaleString('ar-EG', { dateStyle:'medium', timeStyle:'short' }) : '—';
  const isActive = value => value && (Date.now() - new Date(value).getTime()) <= 2 * 60 * 1000;
  let client = null;
  if (!demo) client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  function render(rows) {
    const active = rows.filter(row => !row.banned && row.is_online && isActive(row.last_seen)).length;
    count.textContent = `${rows.length} زائر `;
    list.innerHTML = rows.length ? rows.map(row => {
      const banned = Boolean(row.banned);
      const online = !banned && Boolean(row.is_online) && isActive(row.last_seen);
      return `<article class="visitor-row ${banned ? 'is-banned' : ''}">
        <div class="visitor-row-avatar">${row.gender === 'أنثى' ? 'طالبة' : 'طالب'}</div>
        <div class="visitor-row-info"><strong>${escape(row.name)}</strong><small>${escape(row.email)} · ${escape(row.gender)}</small><small>تاريخ التسجيل: ${formatDate(row.created_at)}</small><small>آخر دخول: ${formatDate(row.last_seen)}</small></div>
        <div class="visitor-actions">
          <button type="button" class="visitor-toggle ${banned ? 'unban' : 'ban'}" data-id="${escape(row.id || row.email)}" data-banned="${banned}">${banned ? 'فك الحظر' : 'حظر'}</button>
        </div>
      </article>`;
    }).join('') : '<div class="empty">لا توجد بيانات زائرين حتى الآن.</div>';
    list.querySelectorAll('.visitor-toggle').forEach(button => button.onclick = () => toggleBan(button.dataset.id, button.dataset.banned === 'true'));
    list.querySelectorAll('.visitor-remove').forEach(button => button.onclick = () => removeVisitor(button.dataset.id, button.dataset.email));
  }

  async function load() {
    if (demo) { let rows = []; try { rows = JSON.parse(localStorage.getItem('materials-visitor-profiles') || '[]'); } catch (_) {} render(rows); return; }
    const session = await client.auth.getSession();
    if (!session.data.session) return;
    const result = await client.from('visitors').select('id,name,email,gender,created_at,last_seen,is_online,banned,banned_at').order('last_seen', { ascending: false });
    if (!result.error) render(result.data || []);
    else list.innerHTML = '<div class="empty">شغّل migration-visitors-admin.sql في Supabase ثم أعد تحميل الصفحة.</div>';
  }

  async function toggleBan(id, currentlyBanned) {
    if (!confirm(currentlyBanned ? 'فك حظر هذا الزائر؟' : 'حظر هذا الزائر؟ لن يستطيع التسجيل أو دخول المكتبة حتى تفك الإدارة الحظر.')) return;
    if (demo) {
      const rows = JSON.parse(localStorage.getItem('materials-visitor-profiles') || '[]');
      const updated = rows.map(row => String(row.id || row.email) === String(id) ? {...row, banned: !currentlyBanned, banned_at: currentlyBanned ? null : new Date().toISOString()} : row);
      localStorage.setItem('materials-visitor-profiles', JSON.stringify(updated)); render(updated); return;
    }
    const result = await client.from('visitors').update({ banned: !currentlyBanned, banned_at: currentlyBanned ? null : new Date().toISOString() }).eq('id', id);
    if (result.error) return alert(`تعذر تحديث حالة الحظر: ${result.error.message}`);
    await load();
  }

  async function removeVisitor(id, email) {
    if (!confirm(`حذف حساب ${email} نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    if (demo) {
      const rows = JSON.parse(localStorage.getItem('materials-visitor-profiles') || '[]').filter(row => String(row.id || row.email) !== String(id || email));
      localStorage.setItem('materials-visitor-profiles', JSON.stringify(rows)); render(rows); return;
    }
    const result = await client.from('visitors').delete().eq('id', id);
    if (result.error) return alert(`تعذر حذف الحساب: ${result.error.message}`);
    await load();
  }

  load();
  window.setInterval(load, 15000);
  if (!demo) {
    client.channel('visitors-admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, () => load())
      .subscribe();
  }
})();
