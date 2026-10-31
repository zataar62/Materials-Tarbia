(function () {
  const config = window.MATERIALS_CONFIG;
  window.materials = Array.isArray(window.s) ? window.s.slice() : [];

  async function loadDemoMaterials() {
    const stored = JSON.parse(localStorage.getItem('materials-demo-rows') || '[]');
    if (!stored.length) return;
    const db = await openDemoDb();
    const mapped = await Promise.all(stored.filter(item => item.published !== false).map(async item => {
      let file = item.file_url || '';
      if (item.file_key) file = `preview.html?file_key=${encodeURIComponent(item.file_key)}&name=${encodeURIComponent(`${item.subject} - ${item.title}`)}`;
      return { ...item, file };
    }));
    window.materials = mapped;
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
      const { data, error } = await client.from('materials').select('id,year,subject,part,title,type,format,file_url:file_url').eq('published', true).order('created_at', { ascending: false });
      if (error || !Array.isArray(data)) return;
      window.materials = data.map(item => ({ ...item, file: item.file_url || '' }));
      if (typeof window.renderFiles === 'function') window.renderFiles();
    }
    loadPublishedMaterials();
    client.channel('public-materials-live').on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, loadPublishedMaterials).subscribe();
  } else {
    loadDemoMaterials().catch(() => {});
    window.addEventListener('storage', event => { if (event.key === 'materials-demo-rows') loadDemoMaterials().catch(() => {}); });
  }
})();
