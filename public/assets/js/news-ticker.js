// 2. News Ticker Logic
var currentNewsIndex = 0;
var newsItems = [];

function initNewsTicker() {
    var $ticker = $('#news-ticker');
    var $text = $ticker.find('#ticker-text');

    if (!$ticker.length) return;

    $ticker.hover(
        function () { $(this).css({ 'background': 'rgba(255, 255, 255, 0.1)', 'transform': 'scale(1)' }); },
        function () { $(this).css({ 'background': 'rgba(0, 0, 0, 0.6)', 'transform': 'scale(1)' }); }
    );

    function cycleTicker() {
        if (newsItems.length === 0) return;
        
        var item = newsItems[currentNewsIndex];

        // Update click handler
        $ticker.off('click').on('click', function () {
            window.open(item.link, '_blank');
        });

        if (typeof gsap !== 'undefined') {
            // Animate Out
            gsap.to($text, {
                opacity: 0, y: -10, duration: 0.3, onComplete: function () {
                    // Set New Text
                    $text.text(item.text);

                    // Reset properties
                    gsap.set($text, { x: 0, y: 10, opacity: 0 });

                    // Measure dimensions
                    var textWidth = $text.outerWidth();
                    var containerMaxWidth = $ticker.find('.ticker-mask').width() || 250; 

                    // Animate In
                    gsap.to($text, {
                        opacity: 1, y: 0, duration: 0.3, onComplete: function () {

                            // Check if scrolling is needed
                            if (textWidth > containerMaxWidth) {
                                var scrollDist = textWidth - containerMaxWidth + 40; 
                                var scrollDuration = scrollDist / 40; 
                                if (scrollDuration < 2) scrollDuration = 2; 

                                // Scroll Animation (Marquee)
                                gsap.to($text, {
                                    x: -scrollDist,
                                    duration: scrollDuration,
                                    ease: "none",
                                    delay: 0.5,
                                    yoyo: true,
                                    repeat: 1,
                                    repeatDelay: 1,
                                    onComplete: nextCycle
                                });
                            } else {
                                // No scroll needed, just wait
                                gsap.delayedCall(4, nextCycle);
                            }
                        }
                    });
                }
            });
        } else {
            // Fallback if GSAP not loaded
            $text.text(item.text);
            setTimeout(nextCycle, 4000);
        }
    }

    function nextCycle() {
        currentNewsIndex = (currentNewsIndex + 1) % newsItems.length;
        cycleTicker();
    }

    // Fetch news data
    fetch('assets/data/news.json')
        .then(response => response.json())
        .then(data => {
            newsItems = data;
            if (newsItems.length > 0) {
                cycleTicker();
            }
        })
        .catch(error => console.error('Error loading news items:', error));
}

$(document).ready(function () {
    initNewsTicker();
});
