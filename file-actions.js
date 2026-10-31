(function () {
  const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];

  function cleanUrl(value) {
    return String(value || '').trim();
  }

  function extensionFromUrl(url) {
    const clean = cleanUrl(url).split(/[?#]/)[0];
    const match = clean.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : '';
  }

  function isImageFile(item) {
    const format = String(item?.format || '').toLowerCase();
    const url = cleanUrl(item?.file || item?.file_url || '');
    return format === 'صورة' || format === 'image' || IMAGE_EXTENSIONS.includes(extensionFromUrl(url));
  }

  function isDemoFile(item) {
    return Boolean(item?.file_key) || /(?:^|[?&])file_key=/.test(cleanUrl(item?.file || item?.file_url));
  }

  function getOriginalFileUrl(item) {
    return cleanUrl(item?.file_url || item?.file || '');
  }

  function getDriveFileId(url) {
    const clean = cleanUrl(url);
    const match = clean.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?id=)([a-zA-Z0-9_-]+)/i)
      || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : '';
  }

  function isDriveUrl(url) {
    return /https?:\/\/(?:drive\.google\.com|docs\.google\.com)\//i.test(cleanUrl(url));
  }

  function getPreviewUrl(item) {
    let url = getOriginalFileUrl(item);
    if (!url && item?.file_key) {
      url = `preview.html?file_key=${encodeURIComponent(item.file_key)}&name=${encodeURIComponent(`${item.subject || ''} - ${item.title || 'معاينة الملف'}`)}`;
    }
    if (!url) return '#';
    // IndexedDB demo files are only available through the local preview page.
    if (isDemoFile(item)) return url;
    // A Drive share link already opens in Google's own file reader.
    if (isDriveUrl(url)) return url;
    // Images open directly in a new browser tab. PDFs use Google's public viewer.
    if (isImageFile(item)) return url;
    return `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(url)}`;
  }

  function getFileExtension(item) {
    if (String(item?.format || '').toUpperCase() === 'PDF') return 'pdf';
    return IMAGE_EXTENSIONS.includes(extensionFromUrl(getOriginalFileUrl(item)))
      ? extensionFromUrl(getOriginalFileUrl(item))
      : 'jpg';
  }

  function makeDownloadUrl(url, filename) {
    const clean = cleanUrl(url);
    if (!clean || clean.startsWith('preview.html')) return clean;
    const driveId = getDriveFileId(clean);
    if (driveId) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
    try {
      const parsed = new URL(clean, location.href);
      if (parsed.hostname.endsWith('supabase.co') && parsed.pathname.includes('/storage/v1/object/public/')) {
        parsed.searchParams.set('download', filename);
        return parsed.toString();
      }
    } catch (_) {}
    return clean;
  }

  function triggerBlobDownload(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  }

  function openDemoDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('materials-demo-files', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function readDemoFile(key) {
    return openDemoDb().then(db => new Promise((resolve, reject) => {
      const request = db.transaction('files', 'readonly').objectStore('files').get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    }));
  }

  async function downloadMaterial(item, fallbackUrl, filename) {
    const finalName = filename || 'ملف دراسي';
    try {
      if (item?.file_key) {
        const file = await readDemoFile(item.file_key);
        if (!file) throw new Error('demo file not found');
        triggerBlobDownload(file, finalName);
        return;
      }
      const sourceUrl = getOriginalFileUrl(item) || fallbackUrl;
      if (!sourceUrl || /(?:^|[?&])file_key=/.test(sourceUrl) || /(?:^|\/)preview\.html(?:[?#]|$)/i.test(sourceUrl)) {
        throw new Error('preview page is not a downloadable source');
      }
      const url = makeDownloadUrl(sourceUrl, finalName);
      const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error('download failed');
      triggerBlobDownload(await response.blob(), finalName);
    } catch (_) {
      // Cross-origin servers may block fetch; use the original file URL, never the preview HTML URL.
      const directUrl = makeDownloadUrl(getOriginalFileUrl(item), finalName);
      if (!directUrl || /(?:^|[?&])file_key=/.test(directUrl) || /(?:^|\/)preview\.html(?:[?#]|$)/i.test(directUrl)) return;
      const anchor = document.createElement('a');
      anchor.href = directUrl;
      anchor.download = finalName;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  }

  window.fileActions = { getPreviewUrl, getOriginalFileUrl, downloadMaterial, getFileExtension, isImageFile };
})();
