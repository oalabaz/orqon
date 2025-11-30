/******************************************************************
	------------------------
	-- TABLE OF CONTENTS --
	------------------------
	
	--  1. Init Background
 ******************************************************************/

/** 1. BACKGROUND INIT
 *******************************************************************/

function init_backgrounds() {
	var error_msg = 'Error! No background is set or something went wrong'

	// Check localStorage for locked background
	var lockedBg = localStorage.getItem('locked_background_mode');
	if (lockedBg) {
		option_hero_background_mode = lockedBg;
	}

	if (typeof is_mobile_device !== 'undefined' && is_mobile_device == true && typeof option_hero_background_mode_mobile !== 'undefined' && option_hero_background_mode_mobile != 'match') {
		option_hero_background_mode = option_hero_background_mode_mobile
	}

	function url_var_handling() {
		if (!$('.options-panel').length) return
		let searchParams = new URLSearchParams(window.location.search)
		if (searchParams.has('bg')) option_hero_background_mode = searchParams.get('bg')
	}
	url_var_handling()

	// Ensure option_hero_background_mode is defined
	if (typeof option_hero_background_mode === 'undefined') {
		console.warn("option_hero_background_mode is undefined. Defaulting to 'asteroids'.");
		option_hero_background_mode = 'asteroids';
	}

	switch (option_hero_background_mode) {
		case 'color':
			if (typeof colorBackground === 'function') colorBackground();
			break
		case 'square':
			if (typeof squareBackground === 'function') squareBackground();
			break
		case 'twisted':
			if (typeof twistedBackground === 'function') twistedBackground();
			break
		case 'asteroids':
			if (typeof asteroidsBackground === 'function') asteroidsBackground();
			break
		case 'circle':
			if (typeof circleBackground === 'function') circleBackground();
			break
		case 'network':
			if (typeof networkBackground === 'function') networkBackground();
			break
		case 'knowledge':
			if (typeof knowledgeBackground === 'function') knowledgeBackground();
			break
		case 'knowledge_core':
			if (typeof knowledgeCoreBackground === 'function') knowledgeCoreBackground();
			break
		case 'tunnel':
			if (typeof tunnelBackground === 'function') tunnelBackground();
			break
		case 'galaxy':
			if (typeof galaxyBackground === 'function') galaxyBackground();
			break
		case 'orbit':
			if (typeof orbitBackground === 'function') orbitBackground();
			break
		default:
			if (typeof asteroidsBackground === 'function') asteroidsBackground();
			break
	}

	// Display current background name
	var bgDisplayName = option_hero_background_mode.replace(/_/g, ' ').toUpperCase();

	// Check if currently locked
	var isLocked = (localStorage.getItem('locked_background_mode') === option_hero_background_mode);
	var lockIconClass = isLocked ? 'ti-lock' : 'ti-unlock';
	var lockTitle = isLocked ? 'Unlock background' : 'Lock background';

	// Wrapper for bottom controls
	var $controlsWrapper = $('<div id="bottom-controls-wrapper" style="position: fixed; bottom: 30px; left: 30px; display: flex; gap: 15px; align-items: center; z-index: 9999; pointer-events: none;"></div>');

	// 1. Background Selector Bubble
	var $bubble = $('<div id="bg-selector-bubble" style="display: flex; align-items: center; gap: 10px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: rgba(255, 255, 255, 0.9); padding: 8px 16px; border-radius: 30px; font-family: sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; pointer-events: auto; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: all 0.3s ease;">' +
		'<span id="bg-name">' + bgDisplayName + '</span>' +
		'<span id="bg-lock-btn" class="' + lockIconClass + '" style="font-size: 14px; padding: 2px;" title="' + lockTitle + '"></span>' +
		'</div>');

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

	// 2. News Ticker
	var newsItems = [
		{ text: "NEW SINGLE 'STARLIT' OUT NOW ON SOUNDCLOUD - CLICK TO LISTEN", link: "https://soundcloud.com/oalabaz/starlit" },
		{ text: "CHECK OUT MY LATEST MEDIUM ARTICLE", link: "https://medium.com/@orkunalabaz/sten-a-thermodynamic-framework-for-solar-routed-space-power-6d0dd8203bd8" }
	];

	var $ticker = $('<div id="news-ticker" class="ticker" >' +
		'<span id="ticker-text" style="display: inline-block;"></span>' +
		'</div>');

	$ticker.hover(
		function () { $(this).css({ 'background': 'rgba(255, 255, 255, 0.1)', 'transform': 'scale(1)' }); },
		function () { $(this).css({ 'background': 'rgba(0, 0, 0, 0.6)', 'transform': 'scale(1)' }); }
	);

	var currentNewsIndex = 0;

	function cycleTicker() {
		var item = newsItems[currentNewsIndex];
		var $text = $ticker.find('#ticker-text');

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
					// We need to check if text is wider than the container's max-width
					// The container has max-width: 300px (defined in CSS).
					// With padding (24px * 2 = 48px), available space is ~252px.
					var textWidth = $text.outerWidth();
					var containerMaxWidth = 250;
					// Note: We use the max-width value we set in the style minus padding. 
					// If the text is shorter, the container shrinks (width: auto).

					// Animate In
					gsap.to($text, {
						opacity: 1, y: 0, duration: 0.3, onComplete: function () {

							// Check if scrolling is needed
							if (textWidth > containerMaxWidth) {
								var scrollDist = textWidth - containerMaxWidth + 40; // +40 for padding/safety
								var scrollDuration = scrollDist / 40; // Speed: 40px/sec
								if (scrollDuration < 2) scrollDuration = 2; // Min duration

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

	// Start the cycle
	cycleTicker();

	// --- AUDIO CONTROL BUBBLE --- //
	var $audioBubble = $('<div id="audio-control-bubble">' +
		'<span class="audio-icon ti-control-play"></span>' +
		'<div class="track-info">' +
			'<span class="track-name">GLOWMASTER</span>' +
			'<span class="track-artist">ORQON</span>' +
		'</div>' +
		'<a href="https://soundcloud.com/oalabaz" target="_blank" class="soundcloud-link ti-soundcloud" title="Listen on SoundCloud"></a>' +
	'</div>');

	$audioBubble.on('click', function(e) {
		if ($(e.target).closest('.soundcloud-link').length) return;
		
		var audio = document.getElementById('glowmaster-audio');
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
	$(document).ready(function() {
		var audio = document.getElementById('glowmaster-audio');
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
	});
	// --- /AUDIO CONTROL BUBBLE --- //

	// Append to wrapper and body
	$controlsWrapper.append($bubble);
	$controlsWrapper.append($audioBubble);
	$controlsWrapper.append($ticker);
	$('body').append($controlsWrapper);
}

// Call init when DOM is ready or immediately if at end of body
$(document).ready(function () {
	init_backgrounds();
});
