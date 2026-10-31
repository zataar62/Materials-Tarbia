(() => {
  const config = window.MATERIALS_CONFIG;
  const demoMode = !config || !window.supabase || !config.supabaseUrl || config.supabaseUrl.includes('YOUR-');
  const DEMO_EMAIL = 'kingbebo1153@gmail.com';
  const DEMO_PASSWORD = 'bebo1957';
  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');
  if (!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    message.textContent = 'جارٍ التحقق...';
    if (demoMode) {
      if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        message.textContent = 'الإيميل أو الباسورد غير صحيح.';
        return;
      }
      sessionStorage.setItem('materials-demo-session', 'active');
      window.location.href = 'admin-dashboard.html';
      return;
    }
    const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) { message.textContent = 'الإيميل أو الباسورد غير صحيح.'; return; }
    window.location.href = 'admin-dashboard.html';
  });
})();
