s = [
  { id: 1, year: 2, subject: 'كيمياء عامة (2)', title: 'محاضرة كيمياء عامة', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 2, year: 2, subject: 'طحالب + تصنيف نبات B', part: 'طحالب', title: 'محاضرات الطحالب', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 15, year: 2, subject: 'طحالب + تصنيف نبات B', part: 'تصنيف نبات B', title: 'محاضرات تصنيف نبات B', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 3, year: 2, subject: 'تطبيقات الفيزياء في الحياة', title: 'ملخص تطبيقات الفيزياء', type: 'ملخصات', format: 'PDF', file: '', note: '' },
  { id: 4, year: 2, subject: 'كهرومغناطيسية', title: 'محاضرة الكهرومغناطيسية', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 5, year: 2, subject: 'تدريس مصغر (2)', title: 'ملزمة التدريس المصغر', type: 'ملازم', format: 'PDF', file: '', note: '' },
  { id: 6, year: 2, subject: 'تطبيقات الرياضيات في الحياة', title: 'تطبيقات الرياضيات', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 7, year: 2, subject: 'قضايا مجتمعية', title: 'ملخص القضايا المجتمعية', type: 'ملخصات', format: 'PDF', file: '', note: '' },
  { id: 8, year: 2, subject: 'الاتجاهات المعاصرة في علم نفس', title: 'محاضرة علم النفس', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 9, year: 2, subject: 'دمج ذوي الاحتياجات الخاصة', title: 'محاضرة الدمج', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 10, year: 2, subject: 'كيمياء الجزيئات الحيوية', title: 'محاضرة الجزيئات الحيوية', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 11, year: 2, subject: 'خبرات دولية في تطوير المناهج', title: 'محاضرة الخبرات الدولية', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 12, year: 2, subject: 'نظريات تربوية وإدارية', title: 'ملخص النظريات التربوية', type: 'ملخصات', format: 'PDF', file: '', note: '' },
  { id: 13, year: 2, subject: 'المهارات الحياتية', title: 'ملزمة المهارات الحياتية', type: 'ملازم', format: 'PDF', file: '', note: '' },
  { id: 14, year: 2, subject: 'القوة الإيجابية في الشخصية', title: 'محاضرة القوة الإيجابية', type: 'محاضرات', format: 'PDF', file: '', note: '' }
];

window.materials = window.materials || s;

let selectedYear = null;
let selectedSubject = null;
let selectedSubSubject = null;
let selectedMediaType = null;

const fileGrid = document.getElementById('fileGrid');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const resultsCount = document.getElementById('resultsCount');
const emptyState = document.getElementById('emptyState');

const styleAnimation = document.createElement('style');
styleAnimation.innerHTML = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade {
    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  #categoryBoxes.subjects-layout {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
    gap: 18px !important;
    margin: 8px 0 30px;
    direction: rtl;
  }

  .subject-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 104px;
    padding: 18px 16px;
    overflow: hidden;
    text-align: right;
    cursor: pointer;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 18px;
    background: var(--surface, #fff);
    box-shadow: 0 5px 18px rgba(15, 23, 42, .045);
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
  }

  .subject-card::after {
    content: "";
    position: absolute;
    inset: 0 0 0 auto;
    width: 4px;
    background: var(--subject-accent, #3b82f6);
    opacity: .9;
  }

  .subject-card:hover,
  .subject-card:focus-visible {
    transform: translateY(-4px);
    border-color: var(--subject-accent, var(--primary, #3b82f6));
    box-shadow: 0 12px 26px rgba(15, 23, 42, .10);
    outline: none;
  }

  .subject-icon {
    flex: 0 0 52px;
    width: 52px;
    height: 52px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    color: var(--subject-accent, #3b82f6);
    background: var(--subject-tint, rgba(59, 130, 246, .10));
  }

  .subject-icon svg { width: 25px; height: 25px; }
  .subject-name {
    color: var(--text, #1e293b);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.8;
  }
  .subject-arrow {
    margin-right: auto;
    flex: 0 0 30px;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 10px;
    color: var(--subject-accent, #64748b);
    background: var(--subject-tint, rgba(59,130,246,.08));
    transition: transform .22s ease, background .22s ease, border-color .22s ease;
  }
  .subject-arrow svg { width: 15px; height: 15px; }
  .subject-card:hover .subject-arrow,
  .subject-card:focus-visible .subject-arrow { transform: translateX(-3px); }

  .subject-caption {
    display: block;
    margin-top: 3px;
    color: var(--text-muted, #64748b);
    font-size: 11px;
    font-weight: 500;
  }

  .unavailable-card {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 42px 20px;
    border: 1px dashed var(--border, #cbd5e1);
    border-radius: 20px;
    background: var(--surface, #fff);
    color: var(--text-muted, #64748b);
    text-align: center;
  }
  .unavailable-card .unavailable-icon {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border-radius: 18px;
    color: #d97706;
    background: rgba(245, 158, 11, .12);
  }
  .unavailable-card strong { color: var(--text, #1e293b); font-size: 17px; }
  .unavailable-card p { margin: 0; font-size: 13px; line-height: 1.8; }

  .materials-back-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    direction: rtl;
    gap: 10px;
    min-height: 46px;
    padding: 7px 14px 7px 10px;
    margin-inline-start: 0;
    text-align: right;
    align-self: flex-start;
    border: 1px solid rgba(37, 99, 235, .16);
    border-radius: 14px;
    background: linear-gradient(135deg, var(--surface, #fff), rgba(37, 99, 235, .055));
    color: var(--primary, #2563eb);
    font-family: "Cairo", "Tajawal", "Segoe UI", sans-serif;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.5;
    letter-spacing: 0;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(15, 23, 42, .045);
    transition: none;
  }
  .materials-back-button .back-button-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    border-radius: 9px;
    background: rgba(37, 99, 235, .10);
    color: var(--primary, #2563eb);
    transition: none;
  }
  .materials-back-button .back-button-icon svg { width: 17px; height: 17px; }
  .materials-back-button .back-button-label { direction: rtl; unicode-bidi: isolate; white-space: nowrap; }
  .materials-back-button:hover,
  .materials-back-button:focus-visible {
    outline: none;
  }
  .materials-back-button .back-button-icon { transform: none; }
  .materials-back-button:active { transform: none; }
  .materials-back-button.is-going-back { pointer-events: none; }
  @media (prefers-reduced-motion: reduce) {
    .materials-back-button, .materials-back-button .back-button-icon { transition: none; animation: none !important; }
  }
  .materials-heading {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin: 10px 0 22px; padding: 18px 20px;
    border-radius: 18px; border: 1px solid var(--border, #e2e8f0);
    background: linear-gradient(135deg, var(--surface, #fff), rgba(59,130,246,.045));
  }
  .materials-heading h3 { margin: 12px 0 0; font-size: 19px; line-height: 1.8; color: var(--text, #1e293b); }
  .materials-heading p { margin: 3px 0 0; color: var(--text-muted, #64748b); font-size: 12px; }
  .materials-heading .pdf-count {
    display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px;
    border-radius: 999px; background: rgba(220,38,38,.09); color: #dc2626;
    font-size: 12px; font-weight: 800; white-space: nowrap;
  }
  .file-card { transition: transform .22s ease, box-shadow .22s ease; }
  .file-card:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(15,23,42,.09); }
  .pdf-empty-state {
    grid-column: 1/-1; padding: 32px 18px; border-radius: 18px; text-align: center;
    border: 1px dashed var(--border, #cbd5e1); color: var(--text-muted, #64748b);
    background: var(--surface, #fff);
  }

  @media (max-width: 520px) {
    #categoryBoxes.subjects-layout {
      grid-template-columns: 1fr;
      gap: 12px !important;
    }
    .subject-card { min-height: 88px; padding: 14px; }
  }
`;
document.head.appendChild(styleAnimation);

function renderFiles() {
  const searchTerm = normalizeSearchText(searchInput ? searchInput.value : '');

  if (selectedYear === null && searchTerm) {
    selectedYear = '2';
  }

  if (selectedYear === null) {
    fileGrid.innerHTML = '';
    resultsCount.textContent = '0 ملف';
    if (emptyState) emptyState.hidden = true;
    return;
  }

  if (selectedSubject) {
    if (/^طحالب\s*\+\s*تصنيف نبات/i.test(selectedSubject) && !selectedSubSubject) {
      showCombinedSubjectOptions();
      return;
    }
    selectedMediaType = 'PDF';
    showActualFiles();
    return;
  }

  showSubjectBoxes();
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

function showSubjectBoxes() {
  let container = document.getElementById('categoryBoxes');
  if (!container) {
    container = document.createElement('div');
    container.id = 'categoryBoxes';
    fileGrid.parentNode.insertBefore(container, fileGrid);
  }
  
  container.className = 'animate-fade subjects-layout';
  container.style.cssText = '';

  if (selectedYear === '1') {
    container.innerHTML = `
      <div class="unavailable-card">
        <div class="unavailable-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
          </svg>
        </div>
        <strong>الفرقة الأولى غير متوفرة حاليًا</strong>
        <p>نعمل على تجهيز المواد الدراسية وسيتم إتاحتها قريبًا إن شاء الله .</p>
      </div>
    `;
    fileGrid.innerHTML = '';
    resultsCount.textContent = '0 ملف';
    if (emptyState) emptyState.hidden = true;
    return;
  }

  const subjects = [
    { name: 'كيمياء عامة (2)', subject: 'كيمياء عامة (2)', accent: '#0f766e', tint: 'rgba(15,118,110,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/><circle cx="10" cy="18" r=".7" fill="currentColor"/><circle cx="14" cy="17" r=".7" fill="currentColor"/></svg>' },
    { name: 'طحالب + تصنيف نبات B', subject: 'طحالب + تصنيف نبات B', accent: '#16a34a', tint: 'rgba(22,163,74,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V10"/><path d="M12 14C5 14 4 8 4 5c6 0 9 3 8 9Z"/><path d="M12 17c7 0 8-5 8-8-6 0-9 3-8 8Z"/><path d="M4 21h16"/></svg>' },
    { name: 'تطبيقات الفيزياء في الحياة', subject: 'تطبيقات الفيزياء في الحياة', accent: '#2563eb', tint: 'rgba(37,99,235,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-60 12 12)"/></svg>' },
    { name: 'كهرومغناطيسية', subject: 'كهرومغناطيسية', accent: '#7c3aed', tint: 'rgba(124,58,237,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 13h6l-1 9 11-13h-7Z"/><path d="M3 5h3M2 9h2M18 19h3"/></svg>' },
    { name: 'تدريس مصغر (2)', subject: 'تدريس مصغر (2)', accent: '#c2410c', tint: 'rgba(194,65,12,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5M7 8h10M7 11h6"/></svg>' },
    { name: 'تطبيقات الرياضيات في الحياة', subject: 'تطبيقات الرياضيات في الحياة', accent: '#0891b2', tint: 'rgba(8,145,178,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h2m4 0h2M8 15h2m4 0h2M8 19h2m4 0h2"/></svg>' },
    { name: 'قضايا مجتمعية', subject: 'قضايا مجتمعية', accent: '#be123c', tint: 'rgba(190,18,60,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20v-2a6.5 6.5 0 0 1 13 0v2zM16 14a5 5 0 0 1 5.5 5v1H18"/></svg>' },
    { name: 'الاتجاهات المعاصرة في علم نفس', subject: 'الاتجاهات المعاصرة في علم نفس', accent: '#9333ea', tint: 'rgba(147,51,234,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H9a4 4 0 0 0-4 4v1a3 3 0 0 0 0 6v1a4 4 0 0 0 4 4h2Z"/><path d="M13 4h2a4 4 0 0 1 4 4v1a3 3 0 0 1 0 6v1a4 4 0 0 1-4 4h-2Z"/><path d="M8 9h3m2 5h3"/></svg>' },
    { name: 'دمج ذوي الاحتياجات الخاصة', subject: 'دمج ذوي الاحتياجات الخاصة', accent: '#0369a1', tint: 'rgba(3,105,161,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 7v5m0-3-5 2m5-2 5 2M12 12l-4 8m4-8 4 8"/><circle cx="12" cy="12" r="9"/></svg>' },
    { name: 'كيمياء الجزيئات الحيوية', subject: 'كيمياء الجزيئات الحيوية', accent: '#ca8a04', tint: 'rgba(202,138,4,.13)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="7" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="14" cy="18" r="2"/><circle cx="5" cy="18" r="1.5"/><path d="m8 7 8-1m1 1-2 9M7 9l6 7M7 18h5"/></svg>' },
    { name: 'خبرات دولية في تطوير المناهج', subject: 'خبرات دولية في تطوير المناهج', accent: '#4f46e5', tint: 'rgba(79,70,229,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a15 15 0 0 1 0 19M12 2.5a15 15 0 0 0 0 19M5 5h14M5 19h14"/></svg>' },
    { name: 'نظريات تربوية وإدارية', subject: 'نظريات تربوية وإدارية', accent: '#475569', tint: 'rgba(71,85,105,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5l8-3 8 3v16M2 21h20M8 8h2m4 0h2M8 12h2m4 0h2M10 21v-4h4v4"/></svg>' },
    { name: 'المهارات الحياتية', subject: 'المهارات الحياتية', accent: '#db2777', tint: 'rgba(219,39,119,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z"/><path d="M8 12h2l1.2-2.5L13 15l1.2-3H16"/></svg>' },
    { name: 'القوة الإيجابية في الشخصية', subject: 'القوة الإيجابية في الشخصية', accent: '#d97706', tint: 'rgba(217,119,6,.12)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 2.8 6.1 6.7.8-4.9 4.5 1.3 6.6-5.9-3.3-5.9 3.3 1.3-6.6-4.9-4.5 6.7-.8L12 2Z"/><path d="m9 12 2 2 4-4"/></svg>' }
  ];

  const searchTerm = normalizeSearchText(searchInput ? searchInput.value : '');
  const dynamicSubjects = [...new Set(materials.filter(item => String(item.year) === String(selectedYear) && item.subject).map(item => item.subject))]
    .filter(name => !subjects.some(sub => sub.subject === name))
    .map(name => ({ name, subject: name, accent: '#a78240', tint: 'rgba(167,130,64,.11)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>' }));
  const allSubjects = subjects.concat(dynamicSubjects);
  const matchingSubjects = allSubjects.filter(sub => normalizeSearchText(sub.name).includes(searchTerm));

  if (searchTerm && matchingSubjects.length === 0) {
    container.innerHTML = `
      <div class="unavailable-card">
        <strong>لا توجد مواد مطابقة للبحث</strong>
        <p>جرّب كتابة اسم المادة أو جزءًا منه.</p>
      </div>
    `;
    fileGrid.innerHTML = '';
    resultsCount.textContent = '0 مادة';
    if (emptyState) emptyState.hidden = true;
    return;
  }

  container.innerHTML = matchingSubjects.map(sub => `
    <button type="button" class="subject-card"
      onclick="selectSubjectHandler('${sub.subject}')"
      style="--subject-accent:${sub.accent}; --subject-tint:${sub.tint}; font-family:inherit; width:100%;"
      aria-label="فتح مادة ${sub.name}">
      <span class="subject-icon">${sub.icon}</span>
      <span>
        <span class="subject-name">${sub.name}</span>
        <span class="subject-caption">الفرقة الثانية - علوم أساسي</span>
      </span>
      <span class="subject-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></span>
    </button>
  `).join('');

  fileGrid.innerHTML = '';
  resultsCount.textContent = searchTerm ? `${matchingSubjects.length} مادة` : '0 ملف';
  if (emptyState) emptyState.hidden = true;
}

function showCombinedSubjectOptions() {
  const container = document.getElementById('categoryBoxes');
  if (!container) return;

  container.className = 'animate-fade subjects-layout';
  container.style.cssText = '';
  container.innerHTML = `
    <div class="materials-heading" style="grid-column:1/-1; direction:rtl;">
      <div>
        <button type="button" onclick="animateBackAndGo(this, 'goBackToSubjects')" class="materials-back-button"><span class="back-button-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12H19M12 5l7 7-7 7"/></svg></span><span class="back-button-label">العودة لقائمة المواد</span></button>
        <h3>طحالب + تصنيف نبات B</h3>
        <p>اختر المادة التي تريد فتحها</p>
      </div>
    </div>
    <button type="button" class="subject-card" onclick="selectSubSubjectHandler('طحالب')" style="--subject-accent:#16a34a; --subject-tint:rgba(22,163,74,.11); font-family:inherit; width:100%;">
      <span class="subject-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V10M12 14C5 14 4 8 4 5c6 0 9 3 8 9ZM12 17c7 0 8-5 8-8-6 0-9 3-8 8Z"/></svg></span>
      <span><span class="subject-name">طحالب</span><span class="subject-caption">ملفات ومحاضرات الطحالب</span></span>
      <span class="subject-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></span>
    </button>
    <button type="button" class="subject-card" onclick="selectSubSubjectHandler('تصنيف نبات B')" style="--subject-accent:#2563eb; --subject-tint:rgba(37,99,235,.11); font-family:inherit; width:100%;">
      <span class="subject-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/></svg></span>
      <span><span class="subject-name">تصنيف نبات B</span><span class="subject-caption">ملفات ومحاضرات التصنيف</span></span>
      <span class="subject-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></span>
    </button>
  `;
  fileGrid.innerHTML = '';
  fileGrid.hidden = true;
  resultsCount.textContent = 'مادتان';
  if (emptyState) emptyState.hidden = true;
}

window.selectSubSubjectHandler = function(part) {
  selectedSubSubject = part;
  selectedMediaType = 'PDF';
  renderFiles();
};

function showMediaTypeBoxes() {
  selectedMediaType = 'PDF';
  showActualFiles();
}

function showActualFiles() {
  let container = document.getElementById('categoryBoxes');
  if (container) {
    container.innerHTML = `
      <div class="materials-heading" style="grid-column:1/-1; direction:rtl;">
        <div>
          <button type="button" onclick="animateBackAndGo(this, '${selectedSubSubject ? 'goBackToSubSubjects' : 'goBackToSubjects'}')" class="materials-back-button"><span class="back-button-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12H19M12 5l7 7-7 7"/></svg></span><span class="back-button-label">${selectedSubSubject ? 'العودة لاختيار المادة' : 'العودة لقائمة المواد'}</span></button>
          <h3>${escapeHTML(selectedSubSubject || selectedSubject)}</h3>
        </div>
      </div>
    `;
  }

  const filtered = materials.filter(item => item.subject === selectedSubject && (!selectedSubSubject || item.part === selectedSubSubject));
  
  fileGrid.className = 'file-grid animate-fade';
  fileGrid.innerHTML = filtered.length ? filtered.map(item => `
    <article class="file-card" style="direction:rtl;">
      <span class="file-type-icon type-${item.type}">${item.format}</span>
      <div class="file-info">
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.subject)} · الفرقة الثانية علوم أساسي</p>
        <div class="file-meta">
          <span class="file-tag">${escapeHTML(item.type)}</span>
          ${item.file ? `<span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><a class="file-link preview-link" href="${escapeHTML(window.fileActions.getPreviewUrl(item))}" target="_blank" rel="noopener noreferrer" title="معاينة ${escapeHTML(item.subject)} — ${escapeHTML(item.title)}">معاينة ↗</a><a class="file-link download-link" href="${escapeHTML(window.fileActions.getOriginalFileUrl(item))}" data-file-key="${escapeHTML(item.file_key || '')}" download="${escapeHTML(downloadFileName(item))}">تنزيل ↓</a></span>` : `<span class="file-link" aria-label="رابط الملف غير مضاف">سيُتاح الملف قريبًا</span>`}
        </div>
      </div>
    </article>
  `).join('') : '<div class="pdf-empty-state">لا توجد ملفات PDF مضافة لهذه المادة حتى الآن.</div>';

  resultsCount.textContent = `${filtered.length} ملف`;
  if (emptyState) emptyState.hidden = true;
  fileGrid.hidden = false;
}

window.selectSubjectHandler = function(subject) {
  selectedSubject = subject;
  selectedSubSubject = null;
  selectedMediaType = null;
  renderFiles();
};

window.goBackToSubSubjects = function() {
  selectedSubSubject = null;
  selectedMediaType = null;
  renderFiles();
};

window.selectMediaTypeHandler = function(mediaType) {
  selectedMediaType = mediaType;
  renderFiles();
};

window.animateBackAndGo = function(button, actionName) {
  if (typeof window[actionName] === 'function') window[actionName]();
};

window.goBackToSubjects = function() {
  selectedSubject = null;
  selectedSubSubject = null;
  selectedMediaType = null;
  renderFiles();
};

window.goBackToMediaTypes = function() {
  selectedMediaType = null;
  selectedSubject = null;
  renderFiles();
};

window.selectYear = function(yearNum, newHtmlText) {
  document.getElementById("mainTitle").innerHTML = newHtmlText;
  selectedYear = String(yearNum)
  selectedSubject = null;
  selectedSubSubject = null;
  selectedMediaType = null;
  
  const markElement = document.getElementById("sectionMark");
  if (markElement) {
    if (yearNum === 1) {
      markElement.innerHTML = "<b style='color: #ffc107;'>01</b> <i> / 02</i>";
    } else {
      markElement.innerHTML = "01 <i> / <b style='color: #ffc107;'>02</b></i>";
    }
  }

  document.querySelectorAll('.year-card').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-year') == yearNum);
  });

  renderFiles();
  document.getElementById('library').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

document.getElementById('yearGrid').addEventListener('click', event => {
  const card = event.target.closest('[data-year]');
  if (!card) return;
  const yearNum = parseInt(card.dataset.year);
  const text = yearNum === 1 ? 'ماتريال الفرقة الأولى،<br><em>علوم أساسي.</em>' : 'ماتريال الفرقة الثانية،<br><em>علوم أساسي.</em>';
  selectYear(yearNum, text);
});

function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }

searchInput.addEventListener('input', renderFiles);
if (typeFilter) typeFilter.addEventListener('change', renderFiles);
document.getElementById('yearNow').textContent = new Date().getFullYear();

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.addEventListener('load', function () {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
});

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
});

function downloadFileName(item) {
  const title = String(item.title || 'ملف دراسي').replace(/[\/:*?"<>|]/g, '-').trim() || 'ملف دراسي';
  return `${title}.${window.fileActions.getFileExtension(item)}`;
}

fileGrid.addEventListener('click', async event => {
  const link = event.target.closest('.download-link');
  if (!link) return;
  event.preventDefault();
  const item = {
    file: link.getAttribute('href') || '',
    file_key: link.dataset.fileKey || '',
    format: link.closest('.file-card')?.querySelector('.file-type-icon')?.textContent?.trim() || ''
  };
  await window.fileActions.downloadMaterial(item, link.href, link.getAttribute('download'));
});
