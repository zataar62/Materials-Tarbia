(() => {
  const config = window.MATERIALS_CONFIG;
  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');
  if (!form) return;

  if (!config?.supabaseUrl || !config?.supabaseAnonKey || !window.supabase) {
    message.textContent = 'إعدادات تسجيل الدخول غير مكتملة. راجع إعدادات النشر.';
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    message.textContent = 'جارٍ التحقق...';

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      message.textContent = 'الإيميل أو الباسورد غير صحيح.';
      return;
    }
    window.location.href = 'admin-dashboard.html';
  });
})();
