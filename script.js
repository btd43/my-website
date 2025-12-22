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

// Show photographs section by default on page load
document.addEventListener('DOMContentLoaded', function() {
    const photographsSection = document.getElementById('photographs');
    if (photographsSection) {
        photographsSection.classList.add('active');
    }
});

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
    setupVideoPlayer('video1', 'playButton1');
    setupVideoPlayer('video2', 'playButton2');
    setupVideoPlayer('video3', 'playButton3');
});

