(function () {
  const config = window.MATERIALS_CONFIG;
  window.materials = Array.isArray(window.s) ? window.s.slice() : [];

  async function loadDemoMaterials() {
    const hasDemoRows = localStorage.getItem('materials-demo-rows') !== null;
    if (!hasDemoRows) return;
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('materials-demo-rows') || '[]'); } catch (_) { stored = []; }
    const db = await openDemoDb();
    const mapped = await Promise.all(stored.filter(item => item && item.published !== false).map(async item => {
      let file = item.file_url || '';
      if (item.file_key) file = `preview.html?file_key=${encodeURIComponent(item.file_key)}&name=${encodeURIComponent(`${item.subject || ''} - ${item.title || ''}`)}`;
      return { ...item, file, section: item.section || 'المحاضرات' };
    }));
    window.materials = mapped.filter(item => item.subject !== 'تصنيف نبات B');
    if (typeof window.renderFiles === 'function') window.renderFiles();
  }

  function openDemoDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('materials-demo-files', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function getDemoFile(db, key) {
    return new Promise(resolve => {
      const request = db.transaction('files', 'readonly').objectStore('files').get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  if (config && config.supabaseUrl && !config.supabaseUrl.includes('YOUR-') && window.supabase) {
    const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    window.materialsClient = client;
    async function loadPublishedMaterials() {
      let result = await client.from('materials').select('id,year,subject,part,section,title,type,format,file_url:file_url').eq('published', true).order('created_at', { ascending: false });
      // Support databases created before the section column was added.
      if (result.error && /section|schema cache/i.test(result.error.message || '')) {
        result = await client.from('materials').select('id,year,subject,part,title,type,format,file_url:file_url').eq('published', true).order('created_at', { ascending: false });
      }
      if (result.error || !Array.isArray(result.data)) return;
      window.materials = result.data.map(item => ({ ...item, section: item.section || 'المحاضرات', file: item.file_url || '' })).filter(item => item.subject !== 'تصنيف نبات B');
      if (typeof window.renderFiles === 'function') window.renderFiles();
    }
    loadPublishedMaterials();
    client.channel('public-materials-live').on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, loadPublishedMaterials).subscribe();
    window.setInterval(loadPublishedMaterials, 5000);
  } else {
    loadDemoMaterials().catch(() => {});
    window.addEventListener('storage', event => { if (event.key === 'materials-demo-rows') loadDemoMaterials().catch(() => {}); });
    window.setInterval(() => loadDemoMaterials().catch(() => {}), 2500);
  }
})();
