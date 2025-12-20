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

