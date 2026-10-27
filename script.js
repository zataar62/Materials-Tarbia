// هذه أسماء توضيحية فقط وليست قائمة رسمية بمواد الفرقة.
// أضف ملفات PDF داخل مجلد materials، ثم اكتب مسار كل ملف في خاصية file.
const materials = [
  { id: 1, year: 2, subject: 'خبرات دولية في تطوير المناهج', title: '', type: 'محاضرات', format: 'PDF', file: '', note: 'مثال تجريبي: أضف ملف المحاضرة الحقيقي' },
  { id: 2, year: 2, subject: ' تربوية — عدّل الاسم', title: 'ملخص مادة (مثال)', type: 'ملخصات', format: 'PDF', file: '', note: 'مثال تجريبي: أضف ملف الملخص الحقيقي' },
  { id: 3, year: 2, subject: 'مادة علوم — عدّل الاسم', title: 'امتحان سابق (مثال)', type: 'امتحانات', format: 'PDF', file: '', note: 'مثال تجريبي: أضف ملف الامتحان الحقيقي' },
  { id: 4, year: 2, subject: 'مادة تربوية — عدّل الاسم', title: 'ملزمة المادة (مثال)', type: 'ملازم', format: 'PDF', file: '', note: 'مثال تجريبي: أضف ملف الملزمة الحقيقي' }
];

let selectedYear = '2';
const fileGrid = document.getElementById('fileGrid');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const resultsCount = document.getElementById('resultsCount');
const emptyState = document.getElementById('emptyState');

function renderFiles() {
  const query = searchInput.value.trim().toLocaleLowerCase('ar');
  const type = typeFilter.value;
  const filtered = materials.filter(item => {
    const matchesYear = selectedYear === 'all' || String(item.year) === selectedYear;
    const searchable = `${item.subject} ${item.title} ${item.type} الفرقة ${item.year}`.toLocaleLowerCase('ar');
    return matchesYear && (type === 'all' || item.type === type) && searchable.includes(query);
  });
  fileGrid.innerHTML = filtered.map(item => {
    const hasFile = Boolean(item.file && item.file.trim());
    const action = hasFile
      ? `<a class="file-link" href="${escapeAttribute(item.file)}" target="_blank" rel="noopener">فتح الملف ←</a>`
      : `<span class="file-link" title="${escapeAttribute(item.note)}">تنزيل</span>`;
    return `<article class="file-card"><span class="file-type-icon type-${item.type}">${item.format}</span><div class="file-info"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.subject)} · الفرقة الثانية علوم أساسي</p><div class="file-meta"><span class="file-tag">${escapeHTML(item.type)}</span>${action}</div></div></article>`;
  }).join('');
  resultsCount.textContent = `${filtered.length} ملف`;
  emptyState.hidden = filtered.length !== 0;
  fileGrid.hidden = filtered.length === 0;
}
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function escapeAttribute(value) { return escapeHTML(value); }
document.getElementById('yearGrid').addEventListener('click', event => {
  const card = event.target.closest('[data-year]');
  if (!card) return;
  selectedYear = card.dataset.year;
  document.querySelectorAll('.year-card').forEach(button => button.classList.toggle('active', button === card));
  renderFiles();
  document.getElementById('library').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
searchInput.addEventListener('input', renderFiles);
typeFilter.addEventListener('change', renderFiles);
document.getElementById('yearNow').textContent = new Date().getFullYear();
renderFiles();
