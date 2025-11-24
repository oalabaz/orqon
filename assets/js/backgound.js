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
		default:
			if (typeof asteroidsBackground === 'function') asteroidsBackground();
			break
	}

	// Display current background name
	var bgDisplayName = option_hero_background_mode.replace(/_/g, ' ').toUpperCase();
	var $bubble = $('<div id="bg-selector-bubble" style="position: fixed; bottom: 30px; left: 30px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: rgba(255, 255, 255, 0.9); padding: 8px 16px; border-radius: 30px; font-family: sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; z-index: 9999; pointer-events: auto; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: all 0.3s ease;" title="Click to change background">' + bgDisplayName + '</div>');

	$bubble.hover(
		function () { $(this).css({ 'background': 'rgba(255, 255, 255, 0.1)', 'transform': 'scale(1.05)' }); },
		function () { $(this).css({ 'background': 'rgba(0, 0, 0, 0.6)', 'transform': 'scale(1)' }); }
	);

	$bubble.on('click', function () {
		// Reload to pick a new random background
		location.reload();
	});

	$('body').append($bubble);
}

// Call init when DOM is ready or immediately if at end of body
$(document).ready(function () {
	init_backgrounds();
});
