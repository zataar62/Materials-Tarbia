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
  const blockedProfileKey = 'materials-visitor-blocked-profile';
  const listKey = 'materials-visitor-profiles';
  const client = window.supabase && window.MATERIALS_CONFIG?.supabaseUrl
    ? window.supabase.createClient(window.MATERIALS_CONFIG.supabaseUrl, window.MATERIALS_CONFIG.supabaseAnonKey)
    : null;
  const getGender = () => form.querySelector('input[name="gender"]:checked')?.value || '';
  const blockedMessage = document.getElementById('visitorBlockedMessage');
  const deletedMessage = document.getElementById('visitorDeletedMessage');
  const studentIcon = female => { const detail = female ? '<path d="M22 27c1-7 5-12 10-12s9 5 10 12c-3-3-6-5-10-5s-7 2-10 5Z" class="icon-hair"/><path d="M27 34c3 2 7 2 10 0" class="icon-smile"/><circle cx="21" cy="35" r="3" class="icon-bow"/><circle cx="43" cy="35" r="3" class="icon-bow"/>' : '<path d="M24 27c2-2 4-3 8-3s6 1 8 3" class="icon-hair"/><path d="M28 34h8" class="icon-smile"/>'; return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="avatarFace" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe3c2"/><stop offset="1" stop-color="#eeb98c"/></linearGradient></defs><circle cx="32" cy="32" r="28" class="icon-ring"/><path d="M14 57c1-12 8-19 18-19s17 7 18 19" class="icon-body"/><path d="M22 28c0-8 4-13 10-13s10 5 10 13c0 7-4 12-10 12S22 35 22 28Z" class="icon-face"/><path d="M20 20 32 11l12 9-12 5-12-5Z" class="icon-cap"/><path d="M17 21h30M44 21v7" class="icon-cap-line"/><circle cx="44" cy="29" r="2" class="icon-tassel"/>${detail}</svg>`; };
  const setGender = value => form.querySelectorAll('input[name="gender"]').forEach(input => { input.checked = input.value === value; });
  async function accountStatus(email) {
    if (!email) return false;
    if (client) {
      const rpc = await client.rpc('visitor_account_status', { p_email: email });
      if (!rpc.error) return rpc.data || 'missing';
      const result = await client.from('visitors').select('banned').eq('email', email).maybeSingle();
      if (result.error) return 'unknown';
      if (!result.data) return 'missing';
      return result.data.banned ? 'banned' : 'active';
    }
    try { const row = JSON.parse(localStorage.getItem(listKey) || '[]').find(item => item.email === email); return !row ? 'missing' : row.banned ? 'banned' : 'active'; } catch (_) { return 'missing'; }
  }
  async function isBanned(email) {
    return (await accountStatus(email)) === 'banned';
  }
  let presenceTimer = null;
  async function touchPresence(email) {
    const now = new Date().toISOString();
    if (client) {
      await client.from('visitors').update({ last_seen: now }).eq('email', email);
      return;
    }
    try {
      const rows = JSON.parse(localStorage.getItem(listKey) || '[]');
      localStorage.setItem(listKey, JSON.stringify(rows.map(row => row.email === email ? {...row, last_seen: now} : row)));
    } catch (_) {}
  }
  function startPresence(email) {
    if (presenceTimer) clearInterval(presenceTimer);
    touchPresence(email);
    presenceTimer = setInterval(async () => {
      const status = await accountStatus(email);
      if (status === 'banned') return lockBanned();
      if (status === 'missing') return showDeleted();
      touchPresence(email);
    }, 5000);
  }
  function lockBanned() {
    if (presenceTimer) clearInterval(presenceTimer);
    const current = saved || JSON.parse(localStorage.getItem(profileKey) || 'null');
    if (current?.email) localStorage.setItem(blockedProfileKey, JSON.stringify(current));
    localStorage.removeItem(profileKey);
    saved = null;
    document.querySelector('.visitor-card')?.classList.add('is-blocked');
    if (blockedMessage) { blockedMessage.hidden = false; blockedMessage.textContent = 'هذا الحساب محظور. لا يمكنك التسجيل أو دخول المكتبة؛ يجب الرجوع إلى الإدارة لفك الحظر أولًا.'; }
    form.hidden = true;
    gate.hidden = false;
    document.body.classList.add('visitor-locked');
    const blocked = JSON.parse(localStorage.getItem(blockedProfileKey) || 'null');
    if (blocked?.email) {
      presenceTimer = setInterval(async () => {
        if (!(await isBanned(blocked.email))) unlockRestoredProfile(blocked);
      }, 5000);
    }
  }
  function unlockRestoredProfile(profile) {
    localStorage.removeItem(blockedProfileKey);
    localStorage.setItem(profileKey, JSON.stringify(profile));
    saved = profile;
    document.querySelector('.visitor-card')?.classList.remove('is-blocked');
    if (blockedMessage) blockedMessage.hidden = true;
    form.hidden = false;
    applyProfile(profile);
    startPresence(profile.email);
  }
  function showDeleted() {
    if (presenceTimer) clearInterval(presenceTimer);
    localStorage.removeItem(profileKey);
    localStorage.removeItem(blockedProfileKey);
    saved = null;
    document.querySelector('.visitor-card')?.classList.remove('is-blocked');
    if (blockedMessage) blockedMessage.hidden = true;
    if (deletedMessage) { deletedMessage.hidden = false; deletedMessage.textContent = 'تم حذف الحساب. يمكنك الآن إنشاء حساب جديد.'; }
    form.hidden = false;
    form.reset();
    passwordInput.required = true;
    cancel.hidden = true;
    title.textContent = 'تم حذف الحساب';
    intro.textContent = 'يمكنك الآن إدخال بياناتك لإنشاء حساب جديد.';
    submit.innerHTML = 'إنشاء حساب جديد <span>←</span>';
    gate.hidden = false;
    document.body.classList.add('visitor-locked');
  }
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
  let saved = null; try { saved = JSON.parse(localStorage.getItem(profileKey) || 'null'); } catch (_) {}
  if (saved?.name && saved?.email && saved?.gender) {
    accountStatus(saved.email).then(status => {
      if (status === 'banned') lockBanned();
      else if (status === 'missing') showDeleted();
      else { applyProfile(saved); startPresence(saved.email); }
    });
  } else {
    let blocked = null; try { blocked = JSON.parse(localStorage.getItem(blockedProfileKey) || 'null'); } catch (_) {}
    if (blocked?.email) accountStatus(blocked.email).then(status => { if (status === 'active') unlockRestoredProfile(blocked); else if (status === 'missing') showDeleted(); else { saved = blocked; lockBanned(); } });
  }
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
    if (await isBanned(email)) {
      localStorage.setItem(blockedProfileKey, JSON.stringify({ name, email, gender, joined_at: oldProfile?.joined_at || new Date().toISOString() }));
      lockBanned(); submit.disabled = false; return;
    }
    const profile = { name, email, gender, banned: false, joined_at: oldProfile?.joined_at || new Date().toISOString() };
    submit.disabled = true; setMessage(editing ? 'جارٍ حفظ التعديلات...' : 'جارٍ حفظ بيانات الدخول...', false);
    try {
      if (client) {
        if (!editing) {
          // نحاول الدخول للحساب الموجود فقط. للزائر الجديد نستخدم جدول visitors مباشرة،
          // حتى لا نرسل أي رسالة تأكيد ونصطدم بحد البريد في Supabase.
          const auth = await client.auth.signInWithPassword({ email, password });
          if (auth.error) {
            // الدخول كزائر لا يحتاج رسالة بريد؛ بياناته ستظهر للأدمن في visitors.
            console.info('Visitor mode: Supabase Auth sign-in skipped for this new visitor.');
          }
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
      passwordInput.value = ''; submit.disabled = false; applyProfile(profile); closeEdit(); startPresence(email);
    } catch (error) {
      setMessage(error.message || 'تعذر حفظ البيانات، حاول مرة أخرى.');
      submit.disabled = false;
    }
  });
})();
