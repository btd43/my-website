// Page navigation - show/hide sections
document.querySelectorAll('.nav-item').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1); // Remove #
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            targetSection.classList.add('active');
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
    });
});

// Show bio section by default on page load
document.addEventListener('DOMContentLoaded', function() {
    const bioSection = document.getElementById('bio');
    if (bioSection) {
        bioSection.classList.add('active');
    }
});

// Journal (local, by day)
const STORIES_STORAGE_KEY = 'btd_journal_v2';

function safeParseJSON(value, fallback) {
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

function loadStories() {
    const raw = window.localStorage.getItem(STORIES_STORAGE_KEY);
    const data = safeParseJSON(raw, null);
    if (data && typeof data === 'object' && data.entries && typeof data.entries === 'object') {
        return data;
    }

    // Migrate from old array format (if present)
    const legacyRaw = window.localStorage.getItem('btd_stories_v1');
    const legacy = safeParseJSON(legacyRaw, []);
    if (Array.isArray(legacy)) {
        const entries = {};
        legacy.forEach((s) => {
            const createdAt = s?.createdAt ? new Date(s.createdAt) : new Date();
            const dateKey = toLocalDateKey(createdAt);
            if (!entries[dateKey]) {
                entries[dateKey] = {
                    title: (s?.title || '').trim(),
                    body: (s?.body || '').trim(),
                    createdAt: createdAt.toISOString(),
                    updatedAt: createdAt.toISOString(),
                };
            }
        });
        const migrated = { version: 2, entries };
        window.localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
    }

    return { version: 2, entries: {} };
}

function saveStories(stories) {
    window.localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(stories));
}

function formatStoryDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function escapeHTML(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function toLocalDateKey(d) {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatDayLabel(dateKey) {
    // dateKey: YYYY-MM-DD (local)
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });
}

function getActiveJournalDate() {
    return window.sessionStorage.getItem('btd_journal_active_date') || toLocalDateKey(new Date());
}

function setActiveJournalDate(dateKey) {
    window.sessionStorage.setItem('btd_journal_active_date', dateKey);
    const labelEl = document.getElementById('journal-active-date');
    if (labelEl) labelEl.textContent = formatDayLabel(dateKey);
}

function getPreview(text) {
    const t = String(text || '').replaceAll('\n', ' ').trim();
    if (!t) return '';
    return t.length > 140 ? `${t.slice(0, 140)}…` : t;
}

function renderStories() {
    const listEl = document.getElementById('stories-list');
    if (!listEl) return;

    const data = loadStories();
    const entries = data.entries || {};
    const activeDate = getActiveJournalDate();

    const keys = Object.keys(entries).sort((a, b) => b.localeCompare(a));
    if (keys.length === 0) {
        listEl.innerHTML = `<div class="story-item"><div class="story-date">No days yet. Tap “Write” to start today.</div></div>`;
        return;
    }

    listEl.innerHTML = keys
        .map((dateKey) => {
            const e = entries[dateKey] || {};
            const title = (e.title || '').trim();
            const body = (e.body || '').trim();
            const preview = getPreview(body);
            const isActive = dateKey === activeDate;
            return `
                <div class="story-item ${isActive ? 'is-active' : ''}" role="button" tabindex="0" data-date="${escapeHTML(dateKey)}">
                    <div class="story-meta">
                        <div class="story-date">${escapeHTML(formatDayLabel(dateKey))}</div>
                        <button class="story-delete" type="button" data-action="delete" data-date="${escapeHTML(dateKey)}">Delete</button>
                    </div>
                    ${title ? `<div class="story-title">${escapeHTML(title)}</div>` : ``}
                    ${preview ? `<div class="story-preview">${escapeHTML(preview)}</div>` : ``}
                </div>
            `;
        })
        .join('');
}

function setStoriesEditorOpen(open) {
    const editor = document.getElementById('stories-editor');
    const titleEl = document.getElementById('stories-title');
    const bodyEl = document.getElementById('stories-body');
    if (!editor || !titleEl || !bodyEl) return;

    if (open) {
        editor.classList.add('active');
        setTimeout(() => {
            bodyEl.focus();
        }, 0);
        return;
    }

    editor.classList.remove('active');
}

function loadDayIntoEditor(dateKey) {
    const titleEl = document.getElementById('stories-title');
    const bodyEl = document.getElementById('stories-body');
    if (!titleEl || !bodyEl) return;

    const data = loadStories();
    const entry = data.entries?.[dateKey] || { title: '', body: '' };
    titleEl.value = entry.title || '';
    bodyEl.value = entry.body || '';
}

function initStories() {
    const newBtn = document.getElementById('stories-new-btn');
    const cancelBtn = document.getElementById('stories-cancel-btn');
    const saveBtn = document.getElementById('stories-save-btn');
    const todayBtn = document.getElementById('journal-today-btn');
    const listEl = document.getElementById('stories-list');
    const titleEl = document.getElementById('stories-title');
    const bodyEl = document.getElementById('stories-body');

    if (!newBtn || !cancelBtn || !saveBtn || !listEl || !titleEl || !bodyEl || !todayBtn) return;

    setActiveJournalDate(getActiveJournalDate());
    renderStories();
    loadDayIntoEditor(getActiveJournalDate());

    todayBtn.addEventListener('click', () => {
        const today = toLocalDateKey(new Date());
        setActiveJournalDate(today);
        loadDayIntoEditor(today);
        renderStories();
        setStoriesEditorOpen(true);
    });

    newBtn.addEventListener('click', () => {
        setStoriesEditorOpen(true);
    });

    cancelBtn.addEventListener('click', () => {
        setStoriesEditorOpen(false);
        loadDayIntoEditor(getActiveJournalDate());
    });

    saveBtn.addEventListener('click', () => {
        const title = titleEl.value.trim();
        const body = bodyEl.value.trim();
        const dateKey = getActiveJournalDate();
        const data = loadStories();
        const prev = data.entries?.[dateKey];
        const nowIso = new Date().toISOString();

        if (!data.entries) data.entries = {};
        if (!title && !body) {
            // If empty, delete the day's entry (if it exists)
            if (prev) {
                delete data.entries[dateKey];
                saveStories(data);
            }
            setStoriesEditorOpen(false);
            renderStories();
            return;
        }

        data.entries[dateKey] = {
            title,
            body,
            createdAt: prev?.createdAt || nowIso,
            updatedAt: nowIso,
        };
        saveStories(data);
        setStoriesEditorOpen(false);
        renderStories();
    });

    listEl.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;

        if (action === 'delete') {
            const dateKey = target.dataset.date;
            if (!dateKey) return;
            const data = loadStories();
            if (data.entries?.[dateKey]) {
                delete data.entries[dateKey];
                saveStories(data);
            }
            renderStories();
            return;
        }

        const item = target.closest('.story-item');
        const dateKey = item?.getAttribute('data-date');
        if (!dateKey) return;
        setActiveJournalDate(dateKey);
        loadDayIntoEditor(dateKey);
        renderStories();
    });

    listEl.addEventListener('keydown', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.classList.contains('story-item')) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const dateKey = target.getAttribute('data-date');
        if (!dateKey) return;
        setActiveJournalDate(dateKey);
        loadDayIntoEditor(dateKey);
        renderStories();
    });
}

// Lightbox functionality for photos
const photoItems = document.querySelectorAll('.photo-item img');
let currentLightbox = null;

// Create lightbox element
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
const lightboxImg = document.createElement('img');
const lightboxClose = document.createElement('span');
lightboxClose.className = 'lightbox-close';
lightboxClose.innerHTML = '×';
lightbox.appendChild(lightboxImg);
lightbox.appendChild(lightboxClose);
document.body.appendChild(lightbox);

// Open lightbox on photo click
photoItems.forEach(img => {
    img.addEventListener('click', function() {
        // Use the full resolution image source
        // If the image has a data-full or similar attribute, use that, otherwise use src
        const fullResSrc = this.getAttribute('data-full') || this.src;
        lightboxImg.src = fullResSrc;
        lightboxImg.alt = this.alt;
        
        // Remove size constraints to show true resolution
        lightboxImg.style.maxWidth = '98%';
        lightboxImg.style.maxHeight = '98%';
        lightboxImg.style.width = 'auto';
        lightboxImg.style.height = 'auto';
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

// Close lightbox
function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

// Close lightbox with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
    }
});

// Minimalist video player functionality
function setupVideoPlayer(videoId, playButtonId) {
    const video = document.getElementById(videoId);
    const playButton = document.getElementById(playButtonId);
    if (!video || !playButton) return;
    
    const wrapper = playButton.closest('.video-player-wrapper');
    if (!wrapper) return;
    
    // Click/touch to play/pause
    function handlePlayPause(e) {
        e.preventDefault();
        e.stopPropagation();
        if (video.paused) {
            video.play().catch(function(error) {
                console.log('Play failed:', error);
            });
            wrapper.classList.add('playing');
        } else {
            video.pause();
            wrapper.classList.remove('playing');
        }
    }
    
    wrapper.addEventListener('click', handlePlayPause);
    wrapper.addEventListener('touchend', handlePlayPause);
    
    // Update play button visibility
    video.addEventListener('play', function() {
        wrapper.classList.add('playing');
    });
    
    video.addEventListener('pause', function() {
        wrapper.classList.remove('playing');
    });
    
    video.addEventListener('ended', function() {
        wrapper.classList.remove('playing');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initStories();

    setupVideoPlayer('video1', 'playButton1');
    setupVideoPlayer('video2', 'playButton2');
    setupVideoPlayer('video3', 'playButton3');
    
    // Force load video metadata and display thumbnails on mobile
    const videos = ['video1', 'video2', 'video3'];
    videos.forEach(function(videoId) {
        const video = document.getElementById(videoId);
        if (video) {
            // Function to show thumbnail
            function showThumbnail() {
                try {
                    if (video.readyState >= 1) { // HAVE_METADATA or higher
                        // Seek to first frame to display thumbnail
                        video.currentTime = 0.01;
                        video.pause();
                        // Force a repaint
                        video.style.display = 'none';
                        video.offsetHeight; // Trigger reflow
                        video.style.display = 'block';
                    }
                } catch(e) {
                    console.log('Thumbnail load error:', e);
                }
            }
            
            // Load metadata immediately
            video.load();
            
            // Set initial time to show thumbnail
            video.currentTime = 0.01;
            
            // Multiple strategies to ensure thumbnail shows
            video.addEventListener('loadedmetadata', function() {
                showThumbnail();
            }, { once: true });
            
            video.addEventListener('loadeddata', function() {
                showThumbnail();
            }, { once: true });
            
            video.addEventListener('canplay', function() {
                showThumbnail();
            }, { once: true });
            
            video.addEventListener('seeked', function() {
                video.pause();
            }, { once: true });
            
            // Fallback: try after delays
            setTimeout(function() {
                showThumbnail();
            }, 100);
            
            setTimeout(function() {
                showThumbnail();
            }, 500);
            
            // Also try when video becomes visible (for lazy loading)
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        showThumbnail();
                        observer.unobserve(video);
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(video);
        }
    });
});
