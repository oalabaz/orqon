// Audio Control Bubble Logic

function initAudioBubble() {
    var $audioBubble = $('#audio-control-bubble');
    if (!$audioBubble.length) return;

    // Fetch audio configuration
    fetch('assets/data/audio.json')
        .then(response => response.json())
        .then(data => {
            // Update UI
            $audioBubble.find('.track-name').text(data.trackName);
            $audioBubble.find('.track-artist').text(data.artist);
            $audioBubble.find('.soundcloud-link').attr('href', data.link);

            // Update Audio Source (if different)
            var audio = document.getElementById('background-audio');
            if (audio) {
                var $source = $(audio).find('source');
                if ($source.attr('src') !== data.source) {
                    $source.attr('src', data.source);
                    if (data.type) $source.attr('type', data.type);
                    audio.load(); // Reload audio element to apply new source
                }
            }
        })
        .catch(err => console.error('Error loading audio config:', err));

    $audioBubble.on('click', function(e) {
        if ($(e.target).closest('.soundcloud-link').length) return;
        
        var audio = document.getElementById('background-audio');
        if (!audio) return;
        
        var $icon = $(this).find('.audio-icon');
        
        if (audio.paused) {
            audio.play().then(function() {
                $icon.removeClass('ti-control-play').addClass('ti-control-pause');
                $audioBubble.addClass('playing');
            }).catch(function(err) {
                console.warn('Audio play failed:', err);
            });
        } else {
            audio.pause();
            $icon.removeClass('ti-control-pause').addClass('ti-control-play');
            $audioBubble.removeClass('playing');
        }
    });
    
    // Update icon when audio ends/pauses externally
    var audio = document.getElementById('background-audio');
    if (audio) {
        audio.addEventListener('ended', function() {
            $audioBubble.find('.audio-icon').removeClass('ti-control-pause').addClass('ti-control-play');
            $audioBubble.removeClass('playing');
        });
        audio.addEventListener('play', function() {
            $audioBubble.find('.audio-icon').removeClass('ti-control-play').addClass('ti-control-pause');
            $audioBubble.addClass('playing');
        });
        audio.addEventListener('pause', function() {
            $audioBubble.find('.audio-icon').removeClass('ti-control-pause').addClass('ti-control-play');
            $audioBubble.removeClass('playing');
        });
    }
}

$(document).ready(function () {
    initAudioBubble();
});
