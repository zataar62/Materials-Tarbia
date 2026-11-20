(() => {
  const panel = document.getElementById('visitorsPanel');
  const list = document.getElementById('visitorsList');
  const count = document.getElementById('visitorsCount');
  if (!panel || !list) return;
  const config = window.MATERIALS_CONFIG;
  const demo = !config || !config.supabaseUrl || config.supabaseUrl.includes('YOUR-');
  const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatDate = value => value ? new Date(value).toLocaleString('ar-EG', { dateStyle:'medium', timeStyle:'short' }) : '—';
  function render(rows) {
    count.textContent = `${rows.length} زائر`;
    list.innerHTML = rows.length ? rows.map(row => `<article class="visitor-row"><div class="visitor-row-avatar">${row.gender === 'أنثى' ? 'طالبة' : 'طالب'}</div><div class="visitor-row-info"><strong>${escape(row.name)}</strong><small>${escape(row.email)} · ${escape(row.gender)}</small></div><time>${formatDate(row.last_seen || row.created_at)}</time></article>`).join('') : '<div class="empty">لا توجد بيانات زائرين حتى الآن.</div>';
  }
  async function load() {
    if (demo) { let rows = []; try { rows = JSON.parse(localStorage.getItem('materials-visitor-profiles') || '[]'); } catch (_) {} render(rows); return; }
    const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const session = await client.auth.getSession();
    if (!session.data.session) return;
    const result = await client.from('visitors').select('name,email,gender,created_at,last_seen').order('last_seen', { ascending: false });
    if (!result.error) render(result.data || []);
    else list.innerHTML = '<div class="empty">شغّل ملف visitors.sql في Supabase ثم أعد تحميل الصفحة.</div>';
  }
  load();
  window.setInterval(load, 15000);
})();
