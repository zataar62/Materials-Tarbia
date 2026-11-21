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
  const title = document.getElementById('visitorGateTitle');
  const intro = document.getElementById('visitorGateIntro');
  const profileKey = 'materials-visitor-profile';
  const registeredKey = 'materials-visitor-registered';
  const listKey = 'materials-visitor-profiles';
  const client = window.supabase && window.MATERIALS_CONFIG?.supabaseUrl
    ? window.supabase.createClient(window.MATERIALS_CONFIG.supabaseUrl, window.MATERIALS_CONFIG.supabaseAnonKey)
    : null;
  const getGender = () => form.querySelector('input[name="gender"]:checked')?.value || '';
  const studentIcon = female => female
    ? `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path class="icon-hair" d="M19 29c-1-11 4-20 13-20s14 9 13 20v16c-2 7-7 10-13 10s-11-3-13-10V29Z"/><circle class="icon-face" cx="32" cy="27" r="8"/><path class="icon-body" d="M13 59c1-11 8-17 19-17s18 6 19 17H13Z"/><path class="icon-cap" d="M13 17 32 8l19 9-19 9-19-9Z"/><path class="icon-cap-line" d="M21 20v5c3 2 7 3 11 3s8-1 11-3v-5"/><path class="icon-detail" d="M27 29h10"/><path class="icon-tassel" d="M51 17v10"/></svg>`
    : `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path class="icon-hair" d="M22 28c-1-10 3-18 10-18s11 8 10 18v5H22Z"/><circle class="icon-face" cx="32" cy="27" r="8"/><path class="icon-body" d="M13 59c1-11 8-17 19-17s18 6 19 17H13Z"/><path class="icon-cap" d="M13 17 32 8l19 9-19 9-19-9Z"/><path class="icon-cap-line" d="M21 20v5c3 2 7 3 11 3s8-1 11-3v-5"/><path class="icon-detail" d="M27 29h10"/><path class="icon-tassel" d="M51 17v10"/></svg>`;
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
    window.dispatchEvent(new CustomEvent('visitor-profile-ready', { detail: profile }));
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
    setMessage('');
    gate.hidden = false;
    document.body.classList.add('visitor-locked');
    nameInput.focus();
  }
  function closeEdit() {
    gate.hidden = true; document.body.classList.remove('visitor-locked'); cancel.hidden = true;
    title.textContent = 'سجّل دخولك للبدء';
    intro.textContent = 'حسابك محفوظ على هذا الجهاز. عدّل بياناتك ثم اضغط حفظ التعديلات.';
    submit.innerHTML = 'دخول إلى المكتبة <span>←</span>';
    submit.disabled = false;
    passwordInput.required = true; passwordInput.placeholder = '6 أحرف على الأقل'; form.reset();
  }
  document.getElementById('editVisitorButton')?.addEventListener('click', openEdit);
  cancel?.addEventListener('click', closeEdit);
  let saved = null;
  let blockedMode = false;
  try { saved = JSON.parse(localStorage.getItem(profileKey) || 'null'); } catch (_) { saved = null; }
  // Recover the one device account from the local profile list if the primary key was refreshed.
  if (!saved?.name || !saved?.email || !saved?.gender) {
    try {
      const cachedProfiles = JSON.parse(localStorage.getItem(listKey) || '[]');
      saved = cachedProfiles.find(row => row?.name && row?.email && row?.gender) || null;
      if (saved) localStorage.setItem(profileKey, JSON.stringify(saved));
    } catch (_) { saved = null; }
  }
  function setBlockedMode(blocked) {
    blockedMode = blocked;
    if (blocked) {
      gate.hidden = false; document.body.classList.add('visitor-locked');
      title.textContent = 'الحساب محظور';
      intro.textContent = 'تم حظر هذا الحساب من الموقع بواسطة الإدارة.';
      setMessage('لا يمكن استخدام المكتبة بهذا الحساب حاليًا. تواصل مع الإدارة.');
      [nameInput, emailInput, passwordInput, ...form.querySelectorAll('input[name="gender"]')].forEach(input => { input.disabled = true; });
      submit.disabled = true; cancel.hidden = true;
    } else if (saved?.name && saved?.email && saved?.gender) {
      [nameInput, emailInput, passwordInput, ...form.querySelectorAll('input[name="gender"]')].forEach(input => { input.disabled = false; });
      submit.disabled = false; applyProfile(saved);
    }
  }
  async function checkVisitorStatus() {
    if (!saved?.email) return;
    try {
      if (client) {
        const result = await client.rpc('get_visitor_status', { p_email: saved.email });
        if (!result.error) return setBlockedMode(!result.data?.length || Boolean(result.data[0].blocked));
      } else {
        const localProfiles = JSON.parse(localStorage.getItem(listKey) || '[]');
        const localRow = localProfiles.find(row => row.email === saved.email);
        return setBlockedMode(!localRow || Boolean(localRow.blocked));
      }
    } catch (_) { /* temporary network errors must not log the visitor out */ }
  }
  if (saved?.name && saved?.email && saved?.gender) {
    // localStorage keeps the visitor signed in on this device across reloads and restarts.
    localStorage.setItem(registeredKey, '1');
    applyProfile(saved);
    checkVisitorStatus();
    window.setInterval(checkVisitorStatus, 4000);
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const editing = !cancel.hidden;
    if (blockedMode) return;
    const oldProfile = saved || JSON.parse(localStorage.getItem(profileKey) || 'null');
    if (!editing && oldProfile?.name && oldProfile?.email && oldProfile?.gender) {
      // A device may have one visitor account only; existing visitors edit their profile.
      applyProfile(oldProfile);
      return;
    }
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
      if (!client) {
        let localProfiles = [];
        try { localProfiles = JSON.parse(localStorage.getItem(listKey) || '[]'); } catch (_) { localProfiles = []; }
        if (localProfiles.some(row => row.email === email && row.blocked)) throw new Error('هذا الحساب محظور من دخول الموقع. تواصل مع الإدارة.');
      }
      if (client) {
        const statusResult = await client.rpc('get_visitor_status', { p_email: email });
        if (!statusResult.error && statusResult.data?.[0]?.blocked) throw new Error('هذا الحساب محظور من دخول الموقع. تواصل مع الإدارة.');
        if (!editing) {
          // نحاول الدخول للحساب الموجود فقط. للزائر الجديد نستخدم جدول visitors مباشرة،
          // حتى لا نرسل أي رسالة تأكيد ونصطدم بحد البريد في Supabase.
          const auth = await client.auth.signInWithPassword({ email, password });
          if (auth.error) {
            // الدخول كزائر لا يحتاج رسالة بريد؛ بياناته ستظهر للأدمن في visitors.
            console.info('Visitor mode: Supabase Auth sign-in skipped for this new visitor.');
          }
          const savedRow = await client.from('visitors').insert({ name, email, gender, last_seen: new Date().toISOString() });
          if (savedRow.error && /duplicate|unique/i.test(savedRow.error.message || '')) throw new Error('هذا البريد مسجل بالفعل. استخدم تعديل البيانات من نفس الجهاز أو بريدًا آخر.');
          if (savedRow.error) throw new Error('تعذر حفظ البيانات في قاعدة البيانات. تأكد من تشغيل ملف supabase-schema.sql ثم حاول مرة أخرى.');
        } else {
          const oldEmail = oldProfile?.email || email;
          // تحديث جدول الزائرين أولًا؛ لا نعطل حفظ البيانات إذا لم توجد جلسة Auth.
          const visitorData = { name, email, gender, last_seen: new Date().toISOString() };
          // Update the existing row by the old email so changing the email does not leave a duplicate row.
          const update = await client.from('visitors').update(visitorData).eq('email', oldEmail);
          if (update.error && !/duplicate|unique/i.test(update.error.message || '')) throw update.error;
          // Older installations may not have the row; create it only in that case.
          if (update.error && /duplicate|unique/i.test(update.error.message || '')) {
            throw new Error('هذا البريد مسجل بالفعل لدى زائر آخر.');
          }
          {
            const fallback = await client.from('visitors').insert(visitorData);
            if (fallback.error && !/duplicate|unique/i.test(fallback.error.message || '')) throw fallback.error;
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
        let profiles = [];
        try { profiles = JSON.parse(localStorage.getItem(listKey) || '[]'); } catch (_) { profiles = []; }
        const oldEmail = oldProfile?.email || email;
        const index = profiles.findIndex(row => row.email === oldEmail);
        const row = { ...profile, last_seen: new Date().toISOString() };
        if (index >= 0) profiles[index] = { ...profiles[index], ...row }; else profiles.unshift(row);
        localStorage.setItem(listKey, JSON.stringify(profiles));
      }
      const previousEmail = oldProfile?.email || profile.email;
      saved = profile;
      localStorage.setItem(profileKey, JSON.stringify(profile));
      localStorage.setItem(registeredKey, '1');
      let cachedProfiles = [];
      try { cachedProfiles = JSON.parse(localStorage.getItem(listKey) || '[]'); } catch (_) { cachedProfiles = []; }
      cachedProfiles = cachedProfiles.filter(row => row.email !== previousEmail && row.email !== profile.email);
      cachedProfiles.unshift({ ...profile, last_seen: new Date().toISOString() });
      localStorage.setItem(listKey, JSON.stringify(cachedProfiles));
      passwordInput.value = ''; submit.disabled = false; applyProfile(profile); closeEdit();
    } catch (error) {
      setMessage(error.message || 'تعذر حفظ البيانات، حاول مرة أخرى.');
      submit.disabled = false;
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== profileKey) return;
    try { saved = JSON.parse(event.newValue || 'null'); } catch (_) { saved = null; }
    if (saved?.name && saved?.email && saved?.gender) { blockedMode = false; applyProfile(saved); checkVisitorStatus(); }
  });
})();
