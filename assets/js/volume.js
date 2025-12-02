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
        volumeContainer.style.cssText = 'position:fixed;top:50%;left:20px;transform:translateY(-50%);background:rgba(9,14,22,0.92);padding:6px;border-radius:9999px;border:1px solid rgba(120,140,170,0.28);box-shadow:0 6px 24px rgba(0,0,0,0.35);backdrop-filter:blur(8px);z-index:1000;display:flex;flex-direction:column;align-items:center;gap:0;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);cursor:pointer;overflow:hidden;';
	
	// Slider wrapper (hidden when collapsed) - now on top
        var sliderWrapper = document.createElement('div');
        sliderWrapper.id = 'volume-slider-wrapper';
        sliderWrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0;height:0;width:44px;overflow:hidden;opacity:0;box-sizing:border-box;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);';
	
        // Volume icon reference (created later but declared here for scope)
        var volumeIcon = null;
        
        // Canvas-based volume slider
        var volumeCanvas = document.createElement('canvas');
        volumeCanvas.id = 'global-volume-slider';
        volumeCanvas.width = 24;
        volumeCanvas.height = 100;
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
        
        // Elastic out function - fast start, overshoots then settles
        function easeOutElastic(t) {
            var c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 
                : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        }
        
        function animateStep() {
            animationProgress += 0.04; // ~25 frames - faster overall
            if (animationProgress >= 1) {
                animatedVol = targetVol;
                drawVolumeSlider(animatedVol);
                animationFrame = null;
            } else {
                // Elastic out - snappy start, bouncy settle
                var eased = easeOutElastic(animationProgress);
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
        
        // Track expanded state
        var isExpanded = false;
        var collapseTimeout = null;
        
        function expandSlider() {
            // Clear any pending collapse
            if (collapseTimeout) {
                clearTimeout(collapseTimeout);
                collapseTimeout = null;
            }
            isExpanded = true;
            sliderWrapper.style.height = '110px';
            sliderWrapper.style.paddingTop = '10px';
            sliderWrapper.style.opacity = '1';
            sliderWrapper.style.marginBottom = '0';
            if (volumeIcon) volumeIcon.style.color = '#c7e3ff';
        }
        
        function collapseSlider() {
            isExpanded = false;
            sliderWrapper.style.height = '0';
            sliderWrapper.style.paddingTop = '0';
            sliderWrapper.style.opacity = '0';
            sliderWrapper.style.marginBottom = '0';
            if (volumeIcon) volumeIcon.style.color = '#9cb6d6';
        }
        
        function collapseSliderDelayed() {
            // Clear any existing timeout
            if (collapseTimeout) {
                clearTimeout(collapseTimeout);
            }
            // Delay collapse by 800ms
            collapseTimeout = setTimeout(function() {
                if (!isDragging) {
                    collapseSlider();
                }
            }, 800);
        }
        
        function getVolumeFromY(y) {
            var padding = 8;
            var barHeight = volumeCanvas.height - padding * 2;
            var relY = Math.max(0, Math.min(barHeight, y - padding));
            var vol = Math.round((1 - relY / barHeight) * 100);
            return Math.max(0, Math.min(100, vol));
        }
        
        function getClientYFromEvent(e) {
            if (e.touches && e.touches.length) {
                return e.touches[0].clientY;
            }
            if (e.changedTouches && e.changedTouches.length) {
                return e.changedTouches[0].clientY;
            }
            return e.clientY;
        }
        
        function handleVolumeChange(e) {
            var rect = volumeCanvas.getBoundingClientRect();
            var clientY = getClientYFromEvent(e);
            var y = clientY - rect.top;
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
            expandSlider(); // Ensure slider stays expanded while dragging
            handleVolumeChange(e);
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Helper to handle volume from wrapper/canvas position
        function handleVolumeFromPosition(clientY) {
            var rect = volumeCanvas.getBoundingClientRect();
            var padding = 8;
            var barHeight = volumeCanvas.height - padding * 2;
            var y = clientY - rect.top - padding;
            var relY = Math.max(0, Math.min(barHeight, y));
            var vol = Math.round((1 - relY / barHeight) * 100);
            vol = Math.max(0, Math.min(100, vol));
            
            globalVolume = vol / 100;
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
        
        // Allow dragging from anywhere on the slider wrapper
        sliderWrapper.addEventListener('mousedown', function(e) {
            isDragging = true;
            expandSlider();
            handleVolumeFromPosition(e.clientY);
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Touch support for slider wrapper
        sliderWrapper.addEventListener('touchstart', function(e) {
            isDragging = true;
            expandSlider();
            var clientY = getClientYFromEvent(e);
            handleVolumeFromPosition(clientY);
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Click on canvas to set volume immediately (for single clicks)
        volumeCanvas.addEventListener('click', function(e) {
            handleVolumeChange(e);
            e.stopPropagation();
        });
        
        // Also handle clicks on the slider wrapper (larger hit area)
        sliderWrapper.addEventListener('click', function(e) {
            handleVolumeFromPosition(e.clientY);
            e.stopPropagation();
        });
        
        volumeCanvas.addEventListener('touchstart', function(e) {
            isDragging = true;
            expandSlider(); // Ensure slider stays expanded while dragging
            handleVolumeChange(e);
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                handleVolumeChange(e);
            }
        });
        
        document.addEventListener('touchmove', function(e) {
            if (isDragging) {
                handleVolumeChange(e);
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                // Delayed collapse after drag ends
                var container = document.getElementById('volume-slider-container');
                if (container && !container.matches(':hover')) {
                    collapseSliderDelayed();
                }
            }
        });
        
        document.addEventListener('touchend', function() {
            if (isDragging) {
                isDragging = false;
                collapseSliderDelayed();
            }
        });
	
	volumeContainer.appendChild(sliderWrapper);
	
	// Volume icon (visible when collapsed) - now on bottom
        volumeIcon = document.createElement('span');
        volumeIcon.id = 'volume-icon';
        volumeIcon.style.cssText = 'color:#9cb6d6;font-size:16px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;transition:all 0.3s ease;cursor:pointer;';
        // Set initial SVG based on volume
        updateVolumeIconSVG(volumeIcon, Math.round(globalVolume * 100));
        
        // Click on icon to toggle mute/unmute
        volumeIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            var audio = document.getElementById('glowmaster-audio');
            
            if (globalVolume > 0) {
                // Mute: store current volume and set to 0
                volumeBeforeMute = globalVolume;
                globalVolume = 0;
            } else {
                // Unmute: restore previous volume (default to 0.5 if was 0)
                globalVolume = volumeBeforeMute > 0 ? volumeBeforeMute : 0.5;
            }
            
            var newVol = Math.round(globalVolume * 100);
            animateToVolume(newVol);
            
            if (audio) {
                if (globalAudioFadeInterval) {
                    clearInterval(globalAudioFadeInterval);
                    globalAudioFadeInterval = null;
                }
                audio.volume = globalVolume;
            }
            updateGlobalVolumeDisplay(newVol);
        });
        
        volumeContainer.appendChild(volumeIcon);
	
	document.body.appendChild(volumeContainer);
	
	// Expand on hover (vertical) - for mouse users
	volumeContainer.addEventListener('mouseenter', function() {
		expandSlider();
	});
	volumeContainer.addEventListener('mouseleave', function() {
		// Don't collapse if currently dragging the slider
		if (!isDragging) {
			collapseSliderDelayed();
		}
	});
	
	// Pointer events for all input types (mouse, touch, pen)
	volumeContainer.addEventListener('pointerdown', function(e) {
		expandSlider();
	});
	
	// Keep slider visible while dragging, collapse when done (if pointer outside)
	document.addEventListener('pointerup', function(e) {
		if (isDragging) {
			setTimeout(function() {
				var container = document.getElementById('volume-slider-container');
				if (container && !container.matches(':hover')) {
					collapseSliderDelayed();
				}
			}, 50);
		}
		// Also collapse if pointer up outside container
		if (isExpanded && !volumeContainer.contains(e.target) && !isDragging) {
			collapseSliderDelayed();
		}
	});
	
	// Touch support - expand immediately on any touch to the container
	volumeContainer.addEventListener('touchstart', function(e) {
		expandSlider();
	}, { passive: true });
	
	// Collapse with delay when touch ends (if not dragging slider)
	volumeContainer.addEventListener('touchend', function(e) {
		if (!isDragging) {
			collapseSliderDelayed();
		}
	}, { passive: true });
	
	// Also collapse when touch leaves the container area
	document.addEventListener('touchend', function(e) {
		if (isExpanded && !volumeContainer.contains(e.target) && !isDragging) {
			collapseSliderDelayed();
		}
	}, { passive: true });

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
		expandSlider();
		// Clear existing timeout
		if (volumeAutoHideTimeout) {
			clearTimeout(volumeAutoHideTimeout);
		}
		// Hide after 2 seconds
		volumeAutoHideTimeout = setTimeout(function() {
			// Only hide if not being hovered
			var container = document.getElementById('volume-slider-container');
			if (container && !container.matches(':hover')) {
				collapseSlider();
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
		svg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
	} else if (vol <= 33) {
		// FiVolume - low (no waves)
		svg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>';
	} else if (vol <= 66) {
		// FiVolume1 - medium (one wave)
		svg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
	} else {
		// FiVolume2 - high (two waves)
		svg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
	}
	icon.innerHTML = svg;
}

function showGlobalVolumeSlider() {
	var wrapper = document.getElementById('volume-slider-wrapper');
	var icon = document.getElementById('volume-icon');
	if (wrapper) {
		wrapper.style.height = '110px';
		wrapper.style.opacity = '1';
		wrapper.style.marginBottom = '0';
	}
	if (icon) {
		icon.style.color = '#aaddff';
	}
}
// --- /GLOBAL VOLUME CONTROL --- //
