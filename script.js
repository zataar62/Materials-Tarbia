const materials = [
  { id: 1, year: 2, subject: 'كيمياء عامة (2)', title: 'محاضرة كيمياء عامة', type: 'محاضرات', format: 'PDF', file: '', note: '' },
  { id: 2, year: 2, subject: 'طحالب + تصنيف نبات B', title: 'محاضرة الطحالب والتصنيف', type: 'محاضرات', format: 'PDF', file: '', note: '' },
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

let selectedYear = null;
let selectedSubject = null;
let selectedMediaType = null;

const fileGrid = document.getElementById('fileGrid');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const resultsCount = document.getElementById('resultsCount');
const emptyState = document.getElementById('emptyState');

const styleAnimation = document.createElement('style');
styleAnimation.innerHTML = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade {
    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;
document.head.appendChild(styleAnimation);

function renderFiles() {
  if (selectedYear === null) {
    fileGrid.innerHTML = '';
    resultsCount.textContent = '0 ملف';
    if (emptyState) emptyState.hidden = true;
    return;
  }

  if (selectedSubject && !selectedMediaType) {
    showMediaTypeBoxes();
    return;
  }

  if (selectedSubject && selectedMediaType) {
    showActualFiles();
    return;
  }

  showSubjectBoxes();
}

function showSubjectBoxes() {
  let container = document.getElementById('categoryBoxes');
  if (!container) {
    container = document.createElement('div');
    container.id = 'categoryBoxes';
    fileGrid.parentNode.insertBefore(container, fileGrid);
  }
  
  container.className = 'animate-fade';
  container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 30px;';

  if (selectedYear === '1') {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted, #64748b); font-size: 16px;">المكتبة مخصصة حالياً للفرقة الثانية، والفرقة الأولى فارغة حالياً.</div>';
    fileGrid.innerHTML = '';
    resultsCount.textContent = '0 ملف';
    if (emptyState) emptyState.hidden = true;
    return;
  }

  const subjects = [
    { name: 'كيمياء عامة (2)', subject: 'كيمياء عامة (2)', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31L4.5 19.7A2 2 0 0 0 6.2 22h11.6a2 2 0 0 0 1.7-2.3L14 9.31V2h-4z"/></svg>' },
    { name: 'طحالب + تصنيف نبات B', subject: 'طحالب + تصنيف نبات B', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
    { name: 'تطبيقات الفيزياء في الحياة', subject: 'تطبيقات الفيزياء في الحياة', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>' },
    { name: 'كهرومغناطيسية', subject: 'كهرومغناطيسية', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
    { name: 'تدريس مصغر (2)', subject: 'تدريس مصغر (2)', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/></svg>' },
    { name: 'تطبيقات الرياضيات في الحياة', subject: 'تطبيقات الرياضيات في الحياة', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' },
    { name: 'قضايا مجتمعية', subject: 'قضايا مجتمعية', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
    { name: 'الاتجاهات المعاصرة في علم نفس', subject: 'الاتجاهات المعاصرة في علم نفس', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/></svg>' },
    { name: 'دمج ذوي الاحتياجات الخاصة', subject: 'دمج ذوي الاحتياجات الخاصة', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
    { name: 'كيمياء الجزيئات الحيوية', subject: 'كيمياء الجزيئات الحيوية', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>' },
    { name: 'خبرات دولية في تطوير المناهج', subject: 'خبرات دولية في تطوير المناهج', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>' },
    { name: 'نظريات تربوية وإدارية', subject: 'نظريات تربوية وإدارية', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>' },
    { name: 'المهارات الحياتية', subject: 'المهارات الحياتية', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
    { name: 'القوة الإيجابية في الشخصية', subject: 'القوة الإيجابية في الشخصية', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' }
  ];

  container.innerHTML = subjects.map(sub => `
    <div class="cat-box" onclick="selectSubjectHandler('${sub.subject}')" style="background: var(--surface, #ffffff); border: 1px solid var(--border, #e2e8f0); padding: 18px 12px; border-radius: 14px; text-align: center; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02);" onmouseover="this.style.transform='translateY(-3px)'; this.style.borderColor='var(--primary, #3b82f6)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='var(--border, #e2e8f0)';">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(59, 130, 246, 0.08); color: var(--primary, #3b82f6); border-radius: 12px; margin-bottom: 10px;">${sub.icon}</div>
      <div style="font-weight: 600; font-size: 13px; color: var(--text, #1e293b);">${sub.name}</div>
    </div>
  `).join('');

  fileGrid.innerHTML = '';
  resultsCount.textContent = '0 ملف';
  if (emptyState) emptyState.hidden = true;
}

function showMediaTypeBoxes() {
  let container = document.getElementById('categoryBoxes');
  if (!container) return;

  container.className = 'animate-fade';
  container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 30px;';

  const mediaTypes = [
    { name: 'ملفات PDF', type: 'PDF', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { name: 'فيديوهات', type: 'فيديوهات', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' },
    { name: 'صور', type: 'صور', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
    { name: 'ملفات صوتية', type: 'صوت', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' }
  ];

  container.innerHTML = `
    <div style="grid-column: 1/-1; margin-bottom: 10px;">
      <button onclick="goBackToSubjects()" style="background: none; border: none; color: var(--primary, #3b82f6); cursor: pointer; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px;">← العودة لقائمة المواد</button>
      <h3 style="margin-top: 5px; font-size: 18px; color: var(--text, #1e293b);">${selectedSubject}</h3>
    </div>
  ` + mediaTypes.map(m => `
    <div class="cat-box" onclick="selectMediaTypeHandler('${m.type}')" style="background: var(--surface, #ffffff); border: 1px solid var(--border, #e2e8f0); padding: 18px 12px; border-radius: 14px; text-align: center; cursor: pointer; transition: all 0.25s ease;" onmouseover="this.style.transform='translateY(-3px)'; this.style.borderColor='var(--primary, #3b82f6)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='var(--border, #e2e8f0)';">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(59, 130, 246, 0.08); color: var(--primary, #3b82f6); border-radius: 12px; margin-bottom: 10px;">${m.icon}</div>
      <div style="font-weight: 600; font-size: 14px; color: var(--text, #1e293b);">${m.name}</div>
    </div>
  `).join('');

  fileGrid.innerHTML = '';
  resultsCount.textContent = '0 ملف';
  if (emptyState) emptyState.hidden = true;
}

function showActualFiles() {
  let container = document.getElementById('categoryBoxes');
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; margin-bottom: 10px;">
        <button onclick="goBackToMediaTypes()" style="background: none; border: none; color: var(--primary, #3b82f6); cursor: pointer; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 5px;">← العودة لأنواع الملفات</button>
        <h3 style="margin-top: 5px; font-size: 18px; color: var(--text, #1e293b);">${selectedSubject} — ${selectedMediaType}</h3>
      </div>
    `;
  }

  const filtered = materials.filter(item => item.subject === selectedSubject);
  
  fileGrid.className = 'file-grid animate-fade';
  fileGrid.innerHTML = filtered.map(item => `
    <article class="file-card">
      <span class="file-type-icon type-${item.type}">${item.format}</span>
      <div class="file-info">
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.subject)} · الفرقة الثانية علوم أساسي</p>
        <div class="file-meta">
          <span class="file-tag">${escapeHTML(item.type)}</span>
          <a class="file-link" href="#" onclick="alert('جاري فتح المحتوى...'); return false;">عرض المحتوى ←</a>
        </div>
      </div>
    </article>
  `).join('');
  
  resultsCount.textContent = `${filtered.length} ملف`;
  if (emptyState) emptyState.hidden = filtered.length !== 0;
  fileGrid.hidden = filtered.length === 0;
}

window.selectSubjectHandler = function(subject) {
  selectedSubject = subject;
  selectedMediaType = null;
  renderFiles();
};

window.selectMediaTypeHandler = function(mediaType) {
  selectedMediaType = mediaType;
  renderFiles();
};

window.goBackToSubjects = function() {
  selectedSubject = null;
  selectedMediaType = null;
  renderFiles();
};

window.goBackToMediaTypes = function() {
  selectedMediaType = null;
  renderFiles();
};

window.selectYear = function(yearNum, newHtmlText) {
  document.getElementById("mainTitle").innerHTML = newHtmlText;
  selectedYear = String(yearNum);
  selectedSubject = null;
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
typeFilter.addEventListener('change', renderFiles);
document.getElementById('yearNow').textContent = new Date().getFullYear();
