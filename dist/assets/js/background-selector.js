// Background Selector Logic

function initBackgroundSelector() {
    var $bubble = $('#bg-selector-bubble');
    if (!$bubble.length) return;

    // Wait for option_hero_background_mode to be defined
    var checkBgInterval = setInterval(function() {
        if (typeof option_hero_background_mode !== 'undefined') {
            clearInterval(checkBgInterval);
            updateBgDisplay();
        }
    }, 100);

    function updateBgDisplay() {
        // Display current background name
        var bgDisplayName = option_hero_background_mode.replace(/_/g, ' ').toUpperCase();
        $bubble.find('#bg-name').text(bgDisplayName);

        // Check if currently locked
        var isLocked = (localStorage.getItem('locked_background_mode') === option_hero_background_mode);
        var $btn = $bubble.find('#bg-lock-btn');
        
        if (isLocked) {
            $btn.removeClass('ti-unlock').addClass('ti-lock');
            $btn.attr('title', 'Unlock background');
        } else {
            $btn.removeClass('ti-lock').addClass('ti-unlock');
            $btn.attr('title', 'Lock background');
        }
    }

    $bubble.hover(
        function () { $(this).css({ 'background': 'rgba(255, 255, 255, 0.1)', 'transform': 'scale(1.05)' }); },
        function () { $(this).css({ 'background': 'rgba(0, 0, 0, 0.6)', 'transform': 'scale(1)' }); }
    );

    $bubble.on('click', function (e) {
        if ($(e.target).closest('#bg-lock-btn').length) return;
        // Reload to pick a new random background
        location.reload();
    });

    $('#bg-lock-btn', $bubble).on('click', function (e) {
        e.stopPropagation();
        var $btn = $(this);
        var currentBg = option_hero_background_mode;

        if ($btn.hasClass('ti-lock')) {
            // Unlock
            localStorage.removeItem('locked_background_mode');
            $btn.removeClass('ti-lock').addClass('ti-unlock');
            $btn.attr('title', 'Lock background');
        } else {
            // Lock
            localStorage.setItem('locked_background_mode', currentBg);
            $btn.removeClass('ti-unlock').addClass('ti-lock');
            $btn.attr('title', 'Unlock background');
        }
    });
}

$(document).ready(function () {
    initBackgroundSelector();
});
