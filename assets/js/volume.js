/******************************************************************
	Volume Control
	Universal volume slider with Feather-style icons
******************************************************************/

// --- GLOBAL VOLUME CONTROL --- //
var globalVolume = 0.5; // Global volume variable (0 to 1)
var globalAudioFadeInterval = null; // Global fade interval reference

function universal_volume_slider_setup() {
	// Don't create if already exists
	if (document.getElementById('volume-slider-container')) return;
	
        var volumeContainer = document.createElement('div');
        volumeContainer.id = 'volume-slider-container';
        volumeContainer.style.cssText = 'position:fixed;top:50%;left:20px;transform:translateY(-50%);background:rgba(9,14,22,0.92);padding:10px;border-radius:24px;border:1px solid rgba(120,140,170,0.28);box-shadow:0 6px 24px rgba(0,0,0,0.35);backdrop-filter:blur(8px);z-index:1000;display:flex;flex-direction:column;align-items:center;gap:2px;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);cursor:pointer;';
	
	// Slider wrapper (hidden when collapsed) - now on top
        var sliderWrapper = document.createElement('div');
        sliderWrapper.id = 'volume-slider-wrapper';
        sliderWrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0;height:0;width:24px;overflow:hidden;opacity:0;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);';
	
        // Canvas-based volume slider
        var volumeCanvas = document.createElement('canvas');
        volumeCanvas.id = 'global-volume-slider';
        volumeCanvas.width = 24;
        volumeCanvas.height = 80;
        volumeCanvas.style.cssText = 'cursor:pointer;';
        sliderWrapper.appendChild(volumeCanvas);
        
        // Animated volume state
        var animatedVol = Math.round(globalVolume * 100);
        var targetVol = animatedVol;
        var startVol = animatedVol;
        var animationFrame = null;
        var animationProgress = 0;
        
        // Draw volume slider on canvas
        function drawVolumeSlider(vol) {
            var ctx = volumeCanvas.getContext('2d');
            var w = volumeCanvas.width;
            var h = volumeCanvas.height;
            var barWidth = 2;
            var barX = (w - barWidth) / 2;
            var padding = 8;
            var barHeight = h - padding * 2;
            var fillHeight = (vol / 100) * barHeight;
            
            ctx.clearRect(0, 0, w, h);
            
            // Draw background track
            ctx.beginPath();
            ctx.roundRect(barX, padding, barWidth, barHeight, 1);
            ctx.fillStyle = 'rgba(110,128,160,0.25)';
            ctx.fill();
            
            // Draw filled portion (from bottom)
            if (vol > 0) {
                ctx.beginPath();
                ctx.roundRect(barX, padding + barHeight - fillHeight, barWidth, fillHeight, 1);
                ctx.fillStyle = '#4dabf7';
                ctx.fill();
            }
            
            // Draw thumb circle at current position
            var thumbY = padding + barHeight - fillHeight;
            var thumbRadius = 4;
            ctx.beginPath();
            ctx.arc(w / 2, thumbY, thumbRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#b0d4ff';
            ctx.fill();
            ctx.shadowColor = 'rgba(100,180,240,0.5)';
            ctx.shadowBlur = 4;
        }
        
        // Animate to target volume with easing
        function animateToVolume(newTarget) {
            startVol = animatedVol;
            targetVol = newTarget;
            animationProgress = 0;
            if (!animationFrame) {
                animationFrame = requestAnimationFrame(animateStep);
            }
        }
        
        // Ease in-out cubic function - slow start, fast middle, slow end
        function easeInOutCubic(t) {
            return t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
        
        function animateStep() {
            animationProgress += 0.03; // ~33 frames to complete
            if (animationProgress >= 1) {
                animatedVol = targetVol;
                drawVolumeSlider(animatedVol);
                animationFrame = null;
            } else {
                // Cubic ease in-out - slow start, fast middle, slow end
                var eased = easeInOutCubic(animationProgress);
                var diff = targetVol - startVol;
                animatedVol = startVol + diff * eased;
                drawVolumeSlider(animatedVol);
                animationFrame = requestAnimationFrame(animateStep);
            }
        }
        
        // Initial draw
        drawVolumeSlider(animatedVol);
        
        // Canvas interaction
        var isDragging = false;
        
        function getVolumeFromY(y) {
            var padding = 8;
            var barHeight = volumeCanvas.height - padding * 2;
            var relY = Math.max(0, Math.min(barHeight, y - padding));
            var vol = Math.round((1 - relY / barHeight) * 100);
            return Math.max(0, Math.min(100, vol));
        }
        
        function handleVolumeChange(e) {
            var rect = volumeCanvas.getBoundingClientRect();
            var y = e.clientY - rect.top;
            var vol = getVolumeFromY(y);
            
            globalVolume = vol / 100;
            // Instant update when dragging (no animation delay)
            animatedVol = vol;
            targetVol = vol;
            drawVolumeSlider(vol);
            
            var audio = document.getElementById('glowmaster-audio');
            if (audio) {
                if (globalAudioFadeInterval) {
                    clearInterval(globalAudioFadeInterval);
                    globalAudioFadeInterval = null;
                }
                audio.volume = globalVolume;
            }
            updateGlobalVolumeDisplay(vol);
        }
        
        volumeCanvas.addEventListener('mousedown', function(e) {
            isDragging = true;
            handleVolumeChange(e);
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                handleVolumeChange(e);
            }
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
	
	volumeContainer.appendChild(sliderWrapper);
	
	// Volume icon (visible when collapsed) - now on bottom
        var volumeIcon = document.createElement('span');
        volumeIcon.id = 'volume-icon';
        volumeIcon.style.cssText = 'color:#9cb6d6;font-size:16px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;transition:all 0.3s ease;';
        // Set initial SVG based on volume
        updateVolumeIconSVG(volumeIcon, Math.round(globalVolume * 100));
        volumeContainer.appendChild(volumeIcon);
	
	document.body.appendChild(volumeContainer);
	
	// Expand on hover (vertical)
	volumeContainer.addEventListener('mouseenter', function() {
                sliderWrapper.style.height = '80px';
                sliderWrapper.style.opacity = '1';
                sliderWrapper.style.marginBottom = '0';
                volumeIcon.style.color = '#c7e3ff';
        });
        volumeContainer.addEventListener('mouseleave', function() {
                sliderWrapper.style.height = '0';
                sliderWrapper.style.opacity = '0';
                sliderWrapper.style.marginBottom = '0';
                volumeIcon.style.color = '#9cb6d6';
        });

	// Track for auto-hide timeout
	var volumeAutoHideTimeout = null;
	var lastDisplayedVolume = Math.round(globalVolume * 100);
	
	// Mouse wheel to adjust volume
	volumeContainer.addEventListener('wheel', function(e) {
		e.preventDefault();
		e.stopPropagation();
		var currentVol = Math.round(globalVolume * 100);
		// Scroll up = increase volume, scroll down = decrease
		var delta = e.deltaY < 0 ? 5 : -5;
		var newVol = Math.max(0, Math.min(100, currentVol + delta));
		
		globalVolume = newVol / 100;
		animateToVolume(newVol);
		
		var audio = document.getElementById('glowmaster-audio');
		if (audio) {
			if (globalAudioFadeInterval) {
				clearInterval(globalAudioFadeInterval);
				globalAudioFadeInterval = null;
			}
			audio.volume = globalVolume;
		}
		updateGlobalVolumeDisplay(newVol);
	}, { passive: false });
	
	// Update volume display periodically to reflect live changes (from audio fades)
	setInterval(function() {
		var audio = document.getElementById('glowmaster-audio');
		if (audio) {
			var vol = Math.round(audio.volume * 100);
			var displayedVol = Math.round(globalVolume * 100);
			if (displayedVol !== vol) {
				globalVolume = audio.volume;
				animateToVolume(vol);
				updateGlobalVolumeDisplay(vol);
				// Show slider temporarily when volume is changing (from fades)
				if (Math.abs(vol - lastDisplayedVolume) >= 1) {
					showGlobalVolumeSliderTemporarily();
				}
			}
			lastDisplayedVolume = vol;
		}
	}, 100);
	
	function showGlobalVolumeSliderTemporarily() {
		var wrapper = document.getElementById('volume-slider-wrapper');
		var icon = document.getElementById('volume-icon');
		if (wrapper) {
                        wrapper.style.height = '80px';
                        wrapper.style.opacity = '1';
                        wrapper.style.marginBottom = '0';
		}
		if (icon) {
			icon.style.color = '#aaddff';
		}
		// Clear existing timeout
		if (volumeAutoHideTimeout) {
			clearTimeout(volumeAutoHideTimeout);
		}
		// Hide after 2 seconds
		volumeAutoHideTimeout = setTimeout(function() {
			// Only hide if not being hovered
			var container = document.getElementById('volume-slider-container');
			if (container && !container.matches(':hover')) {
				if (wrapper) {
                                        wrapper.style.height = '0';
                                        wrapper.style.opacity = '0';
                                        wrapper.style.marginBottom = '0';
                                }
                                if (icon) {
                                        icon.style.color = '#9cb6d6';
                                }
                        }
                }, 2000);
        }
}

function updateGlobalVolumeDisplay(vol) {
	// Update icon based on volume level
	var icon = document.getElementById('volume-icon');
	if (icon) {
		updateVolumeIconSVG(icon, vol);
	}
}

// Helper function to set Feather-style volume SVG icons
function updateVolumeIconSVG(icon, vol) {
	var svg = '';
	if (vol === 0) {
		// FiVolumeX - muted with X
		svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
	} else if (vol <= 33) {
		// FiVolume - low (no waves)
		svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>';
	} else if (vol <= 66) {
		// FiVolume1 - medium (one wave)
		svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
	} else {
		// FiVolume2 - high (two waves)
		svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
	}
	icon.innerHTML = svg;
}

function showGlobalVolumeSlider() {
	var wrapper = document.getElementById('volume-slider-wrapper');
	var icon = document.getElementById('volume-icon');
	if (wrapper) {
		wrapper.style.height = '80px';
		wrapper.style.opacity = '1';
		wrapper.style.marginBottom = '0';
	}
	if (icon) {
		icon.style.color = '#aaddff';
	}
}
// --- /GLOBAL VOLUME CONTROL --- //
