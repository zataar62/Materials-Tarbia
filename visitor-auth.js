(() => {
  const gate = document.getElementById('visitorGate');
  const form = document.getElementById('visitorForm');
  if (!gate || !form) return;
  const nameInput = document.getElementById('visitorName');
  const emailInput = document.getElementById('visitorEmail');
  const passwordInput = document.getElementById('visitorPassword');
  const message = document.getElementById('visitorMessage');
  const submit = form.querySelector('button[type="submit"]');
  const cancel = document.getElementById('visitorCancelEdit');
  const deleteButton = document.getElementById('deleteVisitorButton');
  const title = document.getElementById('visitorGateTitle');
  const intro = document.getElementById('visitorGateIntro');
  const profileKey = 'materials-visitor-profile';
  const listKey = 'materials-visitor-profiles';
  const client = window.supabase && window.MATERIALS_CONFIG?.supabaseUrl
    ? window.supabase.createClient(window.MATERIALS_CONFIG.supabaseUrl, window.MATERIALS_CONFIG.supabaseAnonKey)
    : null;
  const getGender = () => form.querySelector('input[name="gender"]:checked')?.value || '';
  const studentIcon = female => `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="18" r="9"/><path d="M16 52c1-11 7-17 16-17s15 6 16 17"/><path d="M13 40h38v8H13z" class="icon-book"/><path d="M16 39 32 31l16 8-16 8-16-8Z" class="icon-cap"/>${female ? '<path d="M23 27c2 3 5 4 9 4s7-1 9-4" class="icon-detail"/>' : '<path d="M25 27h14" class="icon-detail"/>'}</svg>`;
  const setGender = value => form.querySelectorAll('input[name="gender"]').forEach(input => { input.checked = input.value === value; });
  function setMessage(text, error = true) { message.textContent = text; message.className = error ? 'visitor-message error' : 'visitor-message success'; }
  function applyProfile(profile) {
    const isFemale = profile.gender === 'أنثى';
    const genderLabel = isFemale ? 'طالبة' : 'طالب';
    const nameLabel = document.getElementById('visitorNameLabel');
    const roleLabel = document.getElementById('visitorRoleLabel');
    const genderBadge = document.getElementById('visitorGenderLabel');
    if (nameLabel) nameLabel.textContent = profile.name;
    if (roleLabel) roleLabel.textContent = 'تعديل البيانات';
    if (genderBadge) { genderBadge.textContent = genderLabel; genderBadge.title = genderLabel; genderBadge.className = `visitor-gender-badge ${isFemale ? 'female' : 'male'}`; }
    const avatar = document.getElementById('visitorAvatar');
    if (avatar) { avatar.innerHTML = studentIcon(isFemale); avatar.className = `visitor-avatar-icon ${isFemale ? 'female' : 'male'}`; avatar.setAttribute('aria-label', genderLabel); }
    gate.hidden = true;
    document.body.classList.remove('visitor-locked');
  }
  function openEdit() {
    let profile = null; try { profile = JSON.parse(localStorage.getItem(profileKey) || 'null'); } catch (_) {}
    if (!profile) return;
    nameInput.value = profile.name || '';
    emailInput.value = profile.email || '';
    passwordInput.value = '';
    passwordInput.required = false;
    passwordInput.placeholder = 'اتركها فارغة إذا لن تغيّرها';
    setGender(profile.gender);
    title.textContent = 'تعديل بياناتي';
    intro.textContent = 'عدّل الاسم أو البريد أو النوع. كلمة المرور الجديدة اختيارية.';
    submit.innerHTML = 'حفظ التعديلات <span>✓</span>';
    submit.disabled = false;
    cancel.hidden = false;
    if (deleteButton) { deleteButton.hidden = false; deleteButton.disabled = false; deleteButton.textContent = 'حذف الحساب نهائيًا'; }
    setMessage('');
    gate.hidden = false;
    document.body.classList.add('visitor-locked');
    nameInput.focus();
  }
  function closeEdit() {
    gate.hidden = true; document.body.classList.remove('visitor-locked'); cancel.hidden = true;
    title.textContent = 'سجّل دخولك للبدء';
    intro.textContent = 'اكتب بياناتك مرة واحدة لتظهر لك المكتبة باسمك، ويعرف الأدمن عدد الزائرين المسجلين.';
    submit.innerHTML = 'دخول إلى المكتبة <span>←</span>';
    submit.disabled = false;
    passwordInput.required = true; passwordInput.placeholder = '6 أحرف على الأقل'; form.reset();
  }
  document.getElementById('editVisitorButton')?.addEventListener('click', openEdit);
  cancel?.addEventListener('click', closeEdit);
  deleteButton?.addEventListener('click', async () => {
    let profile = null; try { profile = JSON.parse(localStorage.getItem(profileKey) || 'null'); } catch (_) {}
    if (!profile?.email) return;
    const confirmed = window.confirm('سيتم حذف بيانات حسابك نهائيًا من الموقع. لا يمكن التراجع عن هذا الإجراء. هل تريد المتابعة؟');
    if (!confirmed) return;
    deleteButton.disabled = true; deleteButton.textContent = 'جارٍ حذف الحساب...'; setMessage('جارٍ حذف بيانات الحساب...', false);
    try {
      if (client) {
        const sessionResult = await client.auth.getSession();
        if (sessionResult.data?.session) {
          const result = await client.rpc('delete_my_visitor_account');
          if (result.error) throw result.error;
          await client.auth.signOut();
        } else {
          const result = await client.from('visitors').delete().eq('email', profile.email);
          if (result.error) throw result.error;
        }
      }
      localStorage.removeItem(profileKey);
      const profiles = JSON.parse(localStorage.getItem(listKey) || '[]');
      localStorage.setItem(listKey, JSON.stringify(profiles.filter(row => row.email !== profile.email)));
      saved = null; form.reset(); cancel.hidden = true; if (deleteButton) deleteButton.hidden = true;
      title.textContent = 'سجّل دخولك للبدء';
      intro.textContent = 'تم حذف الحساب. يمكنك التسجيل من جديد في أي وقت.';
      submit.innerHTML = 'دخول إلى المكتبة <span>←</span>'; submit.disabled = false; passwordInput.required = true;
      gate.hidden = false; document.body.classList.add('visitor-locked'); setMessage('تم حذف الحساب وبياناته بنجاح.', false);
    } catch (error) {
      deleteButton.disabled = false; deleteButton.textContent = 'حذف الحساب نهائيًا';
      setMessage(error.message || 'تعذر حذف الحساب. تأكد من تشغيل آخر كود SQL في Supabase.');
    }
  });
  let saved = null; try { saved = JSON.parse(localStorage.getItem(profileKey) || 'null'); } catch (_) {}
  if (saved?.name && saved?.email && saved?.gender) applyProfile(saved);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const editing = !cancel.hidden;
    const oldProfile = saved || JSON.parse(localStorage.getItem(profileKey) || 'null');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const gender = getGender();
    if (name.length < 2) return setMessage('اكتب الاسم بالكامل.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage('اكتب بريدًا إلكترونيًا صحيحًا.');
    if (!editing && password.length < 6) return setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    if (editing && password && password.length < 6) return setMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
    if (!gender) return setMessage('اختار النوع: ذكر أو أنثى.');
    const profile = { name, email, gender, joined_at: oldProfile?.joined_at || new Date().toISOString() };
    submit.disabled = true; setMessage(editing ? 'جارٍ حفظ التعديلات...' : 'جارٍ حفظ بيانات الدخول...', false);
    try {
      if (client) {
        if (!editing) {
          // جرّب الدخول أولًا حتى لا نرسل رسالة تسجيل جديدة للحسابات الموجودة.
          let auth = await client.auth.signInWithPassword({ email, password });
          if (auth.error) {
            const signUp = await client.auth.signUp({ email, password, options: { data: { name, gender } } });
            if (signUp.error && /already registered|already been registered|user already exists/i.test(signUp.error.message || '')) {
              throw new Error('هذا البريد مسجل بالفعل. استخدم كلمة المرور الصحيحة أو عطّل تأكيد البريد من Supabase.');
            }
            auth = signUp;
          }
          if (auth.error && !/confirm/i.test(auth.error.message || '')) throw auth.error;
          const savedRow = await client.from('visitors').insert({ name, email, gender, last_seen: new Date().toISOString() });
          if (savedRow.error && !/duplicate|unique/i.test(savedRow.error.message || '')) console.warn(savedRow.error.message);
        } else {
          const oldEmail = oldProfile?.email || email;
          // تحديث جدول الزائرين أولًا؛ لا نعطل حفظ البيانات إذا لم توجد جلسة Auth.
          const visitorData = { name, email, gender, last_seen: new Date().toISOString() };
          const update = await client.from('visitors').update(visitorData).eq('email', oldEmail);
          if (update.error && !/duplicate|unique/i.test(update.error.message || '')) throw update.error;
          // لو لم يكن السجل موجودًا بسبب تسجيل سابق قبل إنشاء الجدول، أنشئه الآن.
          if (!update.data || update.data.length === 0) {
            const insert = await client.from('visitors').insert(visitorData);
            if (insert.error && !/duplicate|unique/i.test(insert.error.message || '')) throw insert.error;
          }
          // تحديث حساب Supabase اختياري، ولا يمنع حفظ بيانات الزائر.
          const sessionResult = await client.auth.getSession();
          if (sessionResult.data?.session) {
            const authUpdates = { data: { name, gender } };
            if (password) authUpdates.password = password;
            if (email !== oldEmail) authUpdates.email = email;
            const authUpdate = await client.auth.updateUser(authUpdates);
            if (authUpdate.error && !/confirm|session/i.test(authUpdate.error.message || '')) console.warn(authUpdate.error.message);
          }
        }
      } else {
        const profiles = JSON.parse(localStorage.getItem(listKey) || '[]');
        const oldEmail = oldProfile?.email || email;
        const index = profiles.findIndex(row => row.email === oldEmail);
        const row = { ...profile, last_seen: new Date().toISOString() };
        if (index >= 0) profiles[index] = { ...profiles[index], ...row }; else profiles.unshift(row);
        localStorage.setItem(listKey, JSON.stringify(profiles));
      }
      saved = profile; localStorage.setItem(profileKey, JSON.stringify(profile));
      passwordInput.value = ''; submit.disabled = false; applyProfile(profile); closeEdit();
    } catch (error) {
      setMessage(error.message || 'تعذر حفظ البيانات، حاول مرة أخرى.');
      submit.disabled = false;
    }
  });
})();
