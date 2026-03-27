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

// Journal — read-only for visitors; source of truth is data/journal.json in the repo
const JOURNAL_DATA_URL = 'data/journal.json';

let publishedJournal = { version: 2, entries: {} };

function escapeHTML(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatDayLabel(dateKey) {
    // dateKey: YYYY-MM-DD (local)
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });
}

function getPreview(text) {
    const t = String(text || '').replaceAll('\n', ' ').trim();
    if (!t) return '';
    return t.length > 140 ? `${t.slice(0, 140)}…` : t;
}

async function loadPublishedJournal() {
    try {
        const res = await fetch(JOURNAL_DATA_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (data && typeof data === 'object' && data.entries && typeof data.entries === 'object') {
            publishedJournal = data;
        } else {
            publishedJournal = { version: 2, entries: {} };
        }
    } catch {
        publishedJournal = { version: 2, entries: {} };
    }
}

function renderJournalDetail(dateKey) {
    const detailEl = document.getElementById('journal-detail');
    if (!detailEl) return;

    const e = publishedJournal.entries?.[dateKey];
    if (!e) {
        detailEl.hidden = true;
        detailEl.innerHTML = '';
        return;
    }

    const title = (e.title || '').trim();
    const body = (e.body || '').trim();
    detailEl.hidden = false;
    detailEl.innerHTML = `
        <div class="journal-detail-date">${escapeHTML(formatDayLabel(dateKey))}</div>
        ${title ? `<div class="journal-detail-title">${escapeHTML(title)}</div>` : ''}
        ${body ? `<div class="journal-detail-body">${escapeHTML(body)}</div>` : ''}
    `;
}

function renderJournalList(selectedDate) {
    const listEl = document.getElementById('stories-list');
    if (!listEl) return;

    const entries = publishedJournal.entries || {};
    const keys = Object.keys(entries).sort((a, b) => b.localeCompare(a));

    if (keys.length === 0) {
        listEl.innerHTML = `<div class="story-item"><div class="story-date">Nothing published yet.</div></div>`;
        const detailEl = document.getElementById('journal-detail');
        if (detailEl) {
            detailEl.hidden = true;
            detailEl.innerHTML = '';
        }
        return;
    }

    listEl.innerHTML = keys
        .map((dateKey) => {
            const e = entries[dateKey] || {};
            const title = (e.title || '').trim();
            const body = (e.body || '').trim();
            const preview = getPreview(body);
            const isActive = dateKey === selectedDate;
            return `
                <div class="story-item ${isActive ? 'is-active' : ''}" role="button" tabindex="0" data-date="${escapeHTML(dateKey)}">
                    <div class="story-meta">
                        <div class="story-date">${escapeHTML(formatDayLabel(dateKey))}</div>
                    </div>
                    ${title ? `<div class="story-title">${escapeHTML(title)}</div>` : ``}
                    ${preview ? `<div class="story-preview">${escapeHTML(preview)}</div>` : ``}
                </div>
            `;
        })
        .join('');
}

function initJournalReadOnly() {
    const listEl = document.getElementById('stories-list');
    if (!listEl) return;

    loadPublishedJournal().then(() => {
        const keys = Object.keys(publishedJournal.entries || {}).sort((a, b) => b.localeCompare(a));
        const first = keys[0] || null;
        renderJournalList(first);
        if (first) renderJournalDetail(first);
    });

    listEl.addEventListener('click', (e) => {
        const item = e.target.closest('.story-item');
        const dateKey = item?.getAttribute('data-date');
        if (!dateKey) return;
        renderJournalList(dateKey);
        renderJournalDetail(dateKey);
    });

    listEl.addEventListener('keydown', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.classList.contains('story-item')) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const dateKey = target.getAttribute('data-date');
        if (!dateKey) return;
        renderJournalList(dateKey);
        renderJournalDetail(dateKey);
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
    initJournalReadOnly();

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
