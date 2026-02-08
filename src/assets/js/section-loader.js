// Function to reinitialize components after dynamically loading sections
function initScripts() {
    // Reinitialize accordions
    if (typeof initAccordion === 'function') {
        initAccordion();
    }
    
    // Reinitialize scroll animations
    if (typeof initScrollAnimations === 'function') {
        initScrollAnimations();
    }
    
    // Reinitialize lightboxes
    if (typeof GLightbox !== 'undefined') {
        GLightbox({
            selector: '.open-lightbox'
        });
    }
    
    // Reinitialize carousels
    if (typeof Swiper !== 'undefined') {
        const testimonialCarousel = new Swiper('.testimonial-carousel', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 5000,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
        });
    }
    
    console.log('All sections loaded and components initialized');
}
