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

	// Check localStorage for background lock state
	var lockedBg = localStorage.getItem('locked_background_mode');
	var isFirstVisit = localStorage.getItem('bg_visited') === null;
	
	if (isFirstVisit) {
		// First visit: set orbit as default but DO NOT lock it
		option_hero_background_mode = 'orbit';
		localStorage.setItem('bg_visited', 'true');
		localStorage.setItem('bg_index', '0');
	} else if (lockedBg) {
		// Background is locked, use the locked background
		option_hero_background_mode = lockedBg;
	} else {
		// Unlocked: cycle through backgrounds in order
		if (typeof array_background_mode !== 'undefined' && array_background_mode.length > 0) {
			var currentIndex = parseInt(localStorage.getItem('bg_index') || '0', 10);
			currentIndex = (currentIndex + 1) % array_background_mode.length;
			localStorage.setItem('bg_index', currentIndex.toString());
			option_hero_background_mode = array_background_mode[currentIndex];
		}
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
		console.warn("option_hero_background_mode is undefined. Defaulting to 'orbit'.");
		option_hero_background_mode = 'orbit';
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


}

// Call init when DOM is ready or immediately if at end of body
$(document).ready(function () {
	init_backgrounds();
});
