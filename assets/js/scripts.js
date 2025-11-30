/******************************************************************
	
	 


	------------------------
	-- TABLE OF CONTENTS --
	------------------------
	
	--  1. Init
	--  2. Page Loading
	--  3. Smooth Page Scroll
	--  4. Content Elements
	--  5. Cursor
	--  6. Menu
	--  7. Contact Form
	--  8. Scroll Bar / Progress Bar
	--  9. Lightbox
	--  10. Scroll Animations
	--  11. Profile Picture
	--  12. Misc
 
 
 ******************************************************************/

/** 1. Init
 *******************************************************************/

var is_mobile_device = false
if (window.mobileAndTabletCheck()) is_mobile_device = true
if (isIpadOS()) is_mobile_device = true

// --- ENTRANCE MODAL --- //
var glowmasterAudio = null;

function entrance_modal_setup() {
	var modal = document.getElementById('entrance-modal');
	var closeBtn = document.getElementById('modal-close');
	var overlay = document.querySelector('.entrance-modal-overlay');
	glowmasterAudio = document.getElementById('glowmaster-audio');
	
	if (!modal) return;
	
	// Check if already dismissed this session
	if (sessionStorage.getItem('entranceModalDismissed') === 'true') {
		modal.classList.add('hidden');
		return;
	}
	
	function closeModal() {
		if (modal.classList.contains('hidden')) return;
		
		// Animate out with GSAP if available
		if (typeof gsap !== 'undefined') {
			gsap.to('.entrance-modal-panel', {
				duration: 0.4,
				opacity: 0,
				y: 20,
				scale: 0.96,
				ease: 'power2.in'
			});
			gsap.to('.entrance-modal-overlay', {
				duration: 0.5,
				opacity: 0,
				ease: 'power2.in'
			});
			gsap.to(modal, {
				duration: 0.5,
				opacity: 0,
				ease: 'power2.in',
				onComplete: function() {
					modal.classList.add('hidden');
					startGlowmasterAudio();
				}
			});
		} else {
			modal.classList.add('hidden');
			startGlowmasterAudio();
		}
		
		sessionStorage.setItem('entranceModalDismissed', 'true');
	}
	
	function startGlowmasterAudio() {
		if (!glowmasterAudio) return;
		
		glowmasterAudio.volume = 0.7;
		glowmasterAudio.play()
			.then(function() {
				console.log('Glowmaster playback started');
				// Update audio control UI if it exists
				var audioBubble = document.getElementById('audio-control-bubble');
				if (audioBubble) {
					audioBubble.classList.add('playing');
					var icon = audioBubble.querySelector('.audio-icon');
					if (icon) {
						icon.classList.remove('ti-control-play');
						icon.classList.add('ti-control-pause');
					}
				}
			})
			.catch(function(error) {
				console.warn('Audio playback failed:', error);
			});
	}
	
	// Close button click
	if (closeBtn) {
		closeBtn.addEventListener('click', closeModal);
	}
	
	// Overlay click (click outside)
	if (overlay) {
		overlay.addEventListener('click', closeModal);
	}
	
	// ESC key support
	document.addEventListener('keydown', function(e) {
		if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
			closeModal();
		}
	});
}
// --- /ENTRANCE MODAL --- //

function core_init() {
	smooth_scroll()
	accordions_setup()
	carousel_setup()
	lightbox_setup()
	menu_setup()
	scroll_down()
	cursor_setup()
	scroll_animations()
	contact_form()
	tabs_setup()
	custom_audio_player()
	custom_video_player()
	mobile_layout()
	window.addEventListener('load', scroll_bar())
	//options_panel();
	image_setup()
	entrance_modal_setup() // --- ENTRANCE MODAL ---
}
core_init()

/** 2. Page Loading
 *******************************************************************/

function page_intro() {
	var tl = gsap.timeline()

	tl.to(['.loading-screen h3', '.loading-screen .line-frame'], { ease: 'power4.inOut', duration: 1, opacity: 1, y: '100%' })
	tl.to('.loading-screen', { ease: 'expo.out', duration: 1.4, y: '100%', delay: 0.15 })
	tl.set('.loading-screen', { zIndex: -100 })
	tl.from('#main', { ease: 'power3.inOut', duration: 0.8, opacity: 0 }, '-=0.6')
}
window.addEventListener('load', page_intro)

/** 3. Smooth Page Scroll
 *******************************************************************/

function smooth_scroll() {
	viewport = null
	content = gsap.utils.toArray('.right-content .inner-content')[0]
	smoothness = config_smooth_page_scroll_intensity

	if (is_mobile_device == true) smoothness = config_smooth_page_scroll_intensity_mobile

	gsap.set(viewport || content.parentNode, { overflow: 'hidden', position: 'fixed', height: '100%', width: '100%', top: 0, left: 0, right: 0, bottom: 0 })
	gsap.set(content, { overflow: 'visible' })

	let getProp = gsap.getProperty(content),
		setProp = gsap.quickSetter(content, 'y', 'px'),
		setScroll = ScrollTrigger.getScrollFunc(window),
		removeScroll = function () {
			content.style.overflow = 'visible'
		},
		killScrub = function (trigger) {
			let scrub = trigger.getTween ? trigger.getTween() : gsap.getTweensOf(trigger.animation)[0] // getTween() was added in 3.6.2
			scrub && scrub.kill()
			trigger.animation.progress(trigger.progress)
		},
		height,
		isProxyScrolling

	function onResize() {
		height = content.clientHeight
		content.style.overflow = 'visible'
		document.body.style.height = height + 'px'
	}
	onResize()

	ScrollTrigger.addEventListener('refreshInit', onResize)
	ScrollTrigger.addEventListener('refresh', function () {
		removeScroll()
		requestAnimationFrame(removeScroll)
	})

	ScrollTrigger.defaults({ scroller: content })
	ScrollTrigger.prototype.update = function (p) {
		p
	}

	ScrollTrigger.scrollerProxy(content, {
		scrollTop: function scrollTop(value) {
			if (arguments.length) {
				isProxyScrolling = true
				setProp(-value)
				setScroll(value)
				return
			}

			return -getProp('y')
		},
		getBoundingClientRect: function getBoundingClientRect() {
			return {
				top: 0,
				left: 0,
				width: window.innerWidth,
				height: window.innerHeight,
			}
		},
	})

	function el_resize_listener() {
		var erdUltraFast = elementResizeDetectorMaker({
			strategy: 'scroll',
		})

		erdUltraFast.listenTo(document.getElementsByClassName('section-container'), function () {
			ScrollTrigger.refresh()
		})
	}
	el_resize_listener()

	return ScrollTrigger.create({
		animation: gsap.fromTo(
			content,
			{ y: 0 },
			{
				y: function () {
					return document.documentElement.clientHeight - height
				},
				ease: 'none',
				onUpdate: ScrollTrigger.update,
			}
		),
		scroller: window,
		invalidateOnRefresh: true,
		start: 0,
		end: function () {
			return height - document.documentElement.clientHeight
		},
		scrub: smoothness,
		onUpdate: function (self) {
			if (isProxyScrolling) {
				killScrub(self)
				isProxyScrolling = false
			}
		},
		onRefresh: killScrub,
	})
}

/** 4. Content Elements
 *******************************************************************/

/* Accordion */
function accordions_setup() {
	$('.accordion').accordionjs()
	$('.pricing-accordion').accordionjs()
}

/* Tabs */
function tabs_setup() {
	$('.tabs').tabslet({
		mouseevent: 'click',
		attribute: 'href',
		animation: true,
		autorotate: false,
		deeplinking: false,
		pauseonhover: true,
		delay: 200,
		active: 1,
	})
}

/* Carousel */
function carousel_setup() {
	function set_button_position(num) {
		if (num == 'current') {
			num = $('.testimonial-carousel').slick('slickCurrentSlide')
		}

		var height_quote = $('.testimonial-carousel .item').eq(num).find('.quote').height()
		var height_button = $('.testimonial-carousel .arrow-next').height()

		$('.testimonial-carousel .arrow-next').css('top', height_quote + height_button)
	}

	$(window).on('load', function () {
		set_button_position(0)
	})

	window.addEventListener('resize', function () {
		set_button_position('current')
	})

	$('.testimonial-carousel').on('beforeChange', function (event, slick, currentSlide, nextSlide) {
		set_button_position(nextSlide)
	})

	$('.testimonial-carousel').on('afterChange', function (event, slick, currentSlide, nextSlide) {
		ScrollTrigger.refresh()
	})

	$('.testimonial-carousel').slick({
		dots: false,
		infinite: false,
		speed: 250,
		centerMode: true,
		variableWidth: false,
		nextArrow: '<div class="icon-button arrow-next"><span class="ti-arrow-right"></span></div>',
		prevArrow: '<div class="icon-button arrow-prev"><span class="ti-arrow-left"></span></div>',
		arrows: true,
		edgeFriction: 0.5,
		slidesToShow: 1,
		slidesToScroll: 1,
		fade: true,
		cssEase: 'ease',
	})

	$('.image-carousel').slick({
		dots: false,
		infinite: false,
		speed: 350,
		centerMode: true,
		variableWidth: false,
		nextArrow: '<div class="icon-button arrow-next"><span class="ti-arrow-right"></span></div>',
		prevArrow: '<div class="icon-button arrow-prev"><span class="ti-arrow-left"></span></div>',
		arrows: true,
		edgeFriction: 0.25,
		slidesToShow: 1,
		slidesToScroll: 1,
		fade: false,
		cssEase: 'ease',
	})
}

/* Custom Audio Player */
function custom_audio_player() {
	var audio_players = Array.prototype.slice.call(document.querySelectorAll('.audio-player'))

	audio_players.forEach(function (player) {
		var audio = player.querySelectorAll('audio')[0]
		var toggle_btn = player.querySelectorAll('.toggle-btn')[0]
		var progress_bar = player.getElementsByClassName('progress-bar')[0]
		var progress_bar_fill = progress_bar.getElementsByClassName('fill')[0]
		var icon = toggle_btn.querySelector('span')

		var progress

		function update_progress(percent) {
			gsap.to(progress_bar_fill, { css: { width: percent + '%' }, duration: 0.05, overwrite: true, ease: 'none' })
		}

		function update_btn_icon(state) {
			if (state == 'play') {
				icon.classList.remove('ti-control-pause')
				icon.classList.add('ti-control-play')
			} else {
				icon.classList.remove('ti-control-play')
				icon.classList.add('ti-control-pause')
			}
		}

		audio.addEventListener(
			'timeupdate',
			function () {
				progress = audio.currentTime / (audio.duration / 100)
				update_progress(progress)
			},
			false
		)

		audio.addEventListener(
			'ended',
			function () {
				update_btn_icon('play')
			},
			false
		)

		toggle_btn.addEventListener('click', function () {
			if (audio.paused) {
				audio.play()
				update_btn_icon('pause')
			} else {
				audio.pause()
				update_btn_icon('play')
			}
		})

		progress_bar.addEventListener('click', function (e) {
			audio.play()
			update_btn_icon('pause')
			var click_position = e.pageX - this.getBoundingClientRect().x
			audio.currentTime = (click_position / (progress_bar.offsetWidth / 100)) * (audio.duration / 100)
		})
	})
}

/* Custom video Player */
function custom_video_player() {
	var video_players = Array.prototype.slice.call(document.querySelectorAll('.video-player'))

	video_players.forEach(function (player) {
		var video = player.querySelectorAll('video')[0]
		var toggle_btn = player.querySelectorAll('.toggle-btn')[0]
		var fullscreen_btn = player.querySelectorAll('.fullscreen-btn')[0]
		var progress_bar = player.getElementsByClassName('progress-bar')[0]
		var progress_bar_fill = progress_bar.getElementsByClassName('fill')[0]
		var icon = toggle_btn.querySelector('span')
		var block_hide = false

		var progress

		function update_progress(percent) {
			gsap.to(progress_bar_fill, { css: { width: percent + '%' }, duration: 0.05, overwrite: true, ease: 'none' })
		}

		function update_btn_icon(state) {
			if (state == 'play') {
				icon.classList.remove('ti-control-pause')
				icon.classList.add('ti-control-play')
			} else {
				icon.classList.remove('ti-control-play')
				icon.classList.add('ti-control-pause')
			}
		}

		function hide_ui() {
			block_hide = false
			setTimeout(function () {
				if (block_hide == true || video.paused) return
				player.classList.add('hide-ui')
			}, 100)
		}

		function show_ui() {
			player.classList.remove('hide-ui')
			block_hide = true
		}

		player.addEventListener('mouseleave', hide_ui)
		player.addEventListener('mouseenter', show_ui)

		video.addEventListener(
			'timeupdate',
			function () {
				progress = video.currentTime / (video.duration / 100)
				update_progress(progress)
			},
			false
		)

		video.addEventListener(
			'ended',
			function () {
				update_btn_icon('play')
				show_ui()
			},
			false
		)

		toggle_btn.addEventListener('click', function () {
			if (video.paused) {
				video.play()
				update_btn_icon('pause')
			} else {
				video.pause()
				update_btn_icon('play')
			}
		})

		fullscreen_btn.addEventListener('click', function () {
			if (video.mozRequestFullScreen) {
				video.mozRequestFullScreen()
			} else if (video.webkitRequestFullScreen) {
				video.webkitRequestFullScreen()
			}
		})

		progress_bar.addEventListener('click', function (e) {
			video.play()
			update_btn_icon('pause')
			var click_position = e.pageX - this.getBoundingClientRect().x
			video.currentTime = (click_position / (progress_bar.offsetWidth / 100)) * (video.duration / 100)
		})
	})
}

/** 5. Cursor
 *******************************************************************/

function cursor_setup() {
	if (config_cursor_mode == 'default' || is_mobile_device == true) return

	$('body').append('<div class="c_cursor_outer"><div class="circle"></div><div class="bg"></div></div></div><div class="c_cursor_inner"></div>')

	gsap.set(['.c_cursor_outer', '.c_cursor_inner'], { xPercent: -50, yPercent: -50 })

	if (config_cursor_mode == 'cursor_1') {
		$('.c_cursor_inner').css('display', 'none')
	}

	const cursor_outer = document.querySelector('.c_cursor_outer')
	const cursor_inner = document.querySelector('.c_cursor_inner')

	const pos_o = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
	const pos_i = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

	const mouse = { x: 0, y: 0 }

	const speed_o = 0.4
	const speed_i = 1

	const x_set_o = gsap.quickSetter(cursor_outer, 'x', 'px')
	const y_set_o = gsap.quickSetter(cursor_outer, 'y', 'px')

	const x_set_i = gsap.quickSetter(cursor_inner, 'x', 'px')
	const y_set_i = gsap.quickSetter(cursor_inner, 'y', 'px')

	window.addEventListener('mousemove', function (e) {
		mouse.x = e.x
		mouse.y = e.y
	})

	gsap.ticker.add(function () {
		const dt_o = 1.0 - Math.pow(1.0 - speed_o, gsap.ticker.deltaRatio())
		const dt_i = 1.0 - Math.pow(1.0 - speed_i, gsap.ticker.deltaRatio())

		pos_o.x += (mouse.x - pos_o.x) * dt_o
		pos_o.y += (mouse.y - pos_o.y) * dt_o
		pos_i.x += (mouse.x - pos_i.x) * dt_i
		pos_i.y += (mouse.y - pos_i.y) * dt_i

		x_set_o(pos_o.x)
		y_set_o(pos_o.y)
		x_set_i(pos_i.x)
		y_set_i(pos_i.y)
	})

	var click_tl = gsap.timeline().pause()

	click_tl.set('.c_cursor_outer .circle', { opacity: 1 })
	click_tl.to('.c_cursor_outer .circle', { duration: 0.45, opacity: 1, width: '100%', height: '100%', ease: 'power4.out' })
	click_tl.set('.c_cursor_outer .circle', { width: '0', height: '0', opacity: 0 })

	window.addEventListener('mousedown', function () {
		click_tl.seek(0).play()
	})

	document.addEventListener('mouseleave', function () {
		gsap.to(['.c_cursor_outer', '.c_cursor_inner'], { duration: 0.2, opacity: 1, scale: 0, overwrite: true })
	})

	document.addEventListener('mouseenter', function () {
		gsap.to(['.c_cursor_outer', '.c_cursor_inner'], { duration: 0.2, opacity: 1, scale: 1, overwrite: true })
	})
}

/** 6. Menu
 *******************************************************************/

function menu_setup() {
	var menu_position = 'closed'
	var menu_moving = false
	var menu_timeline = gsap.timeline()
	var menu_btn = $('.m-menu-button')

	$('#main').append('<div class="menu-overlay"></div>')

	gsap.set('.m-menu', { x: '100%' })
	gsap.set('.m-menu .head p', { y: '100%' })
	gsap.set('.m-menu .main-items a', { y: '100%' })
	gsap.set('.m-menu .social-items a', { y: '100%' })

	function update_timeline(mode) {
		menu_timeline = gsap.timeline()

		if (mode == 'open') {
			menu_timeline.to('.m-menu-button .line:first-child', { duration: 0.35, rotate: 45, y: '0.4rem', ease: 'power4.inOut' }, 0)
			menu_timeline.to('.m-menu-button .line:last-child', { duration: 0.35, rotate: -45, y: '-0.4rem', ease: 'power4.inOut' }, 0)

			gsap.set('.menu-overlay', { css: { zIndex: 100 } })

			menu_timeline.to('#main', { duration: 0.8, opacity: 0.45, x: '-24%', ease: 'power4.inOut' }, 0)

			menu_timeline.to('.m-menu', { duration: 0.8, x: '0%', ease: 'power4.inOut' }, '-=0.8')

			menu_timeline.to('.m-menu .head p', { duration: 0.6, y: '0%', ease: 'expo.out' })
			menu_timeline.to('.m-menu .main-items a', { duration: 0.6, y: '0%', ease: 'expo.out', stagger: 0.1 }, '-=0.6')
			menu_timeline.to('.m-menu .social-items a', { duration: 0.6, y: '0%', ease: 'expo.out', stagger: 0.1 }, '-=0.6')

			menu_timeline.eventCallback('onComplete', function () {
				menu_position = 'opened'
				menu_moving = false
			})
		}

		if (mode == 'close') {
			gsap.set('.menu-overlay', { css: { zIndex: -100 } })

			menu_timeline.to('.m-menu .head p', { duration: 0.6, y: '100%', ease: 'power2.in' })
			menu_timeline.to('.m-menu .main-items a', { duration: 0.6, y: '100%', ease: 'power2.in' }, '-=0.6')
			menu_timeline.to('.m-menu .social-items a', { duration: 0.6, y: '100%', ease: 'power2.in' }, '-=0.6')

			menu_timeline.to('.m-menu', { duration: 0.7, x: '100%', ease: 'power4.inOut' })

			menu_timeline.to('#main', { duration: 0.7, opacity: 1, x: '0', ease: 'power4.inOut' }, '-=0.7')

			menu_timeline.to('.m-menu-button .line:first-child', { duration: 0.35, rotate: 0, y: 0, ease: 'power4.inOut' })
			menu_timeline.to('.m-menu-button .line:last-child', { duration: 0.35, rotate: 0, y: 0, ease: 'power4.inOut' }, '-=0.35')

			menu_timeline.eventCallback('onComplete', function () {
				menu_position = 'closed'
				menu_moving = false
			})
		}
	}

	$('.menu-overlay').on('click', function () {
		if (menu_moving == true) return

		if (menu_position == 'opened') {
			menu_moving = true
			update_timeline('close')
		}
	})

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') {
			if (menu_moving == true) return
			menu_moving = true

			if (menu_position == 'opened') {
				update_timeline('close')
			} else {
				update_timeline('open')
			}
		}
	})

	menu_btn.on('click', function () {
		if (menu_moving == true) return
		menu_moving = true

		if (menu_position == 'opened') {
			update_timeline('close')
		} else {
			update_timeline('open')
		}
	})

	// Scroll to section on nav item click
	function setupLinks(scroller) {
		let linkElements = gsap.utils.toArray('.m-menu .main-items a.scroll-to'),
			linkTargets = linkElements.map(function (e) {
				return document.querySelector(e.getAttribute('href'))
			}),
			linkPositions = [],
			calculatePositions = function calculatePositions() {
				var offset = gsap.getProperty(scroller, 'y')
				linkTargets.forEach(function (e, i) {
					return (linkPositions[i] = e.getBoundingClientRect().top - offset)
				})
			}

		linkElements.forEach(function (element, i) {
			element.addEventListener('click', function (e) {
				e.preventDefault()
				gsap.to(window, {
					scrollTo: linkPositions[i],
					ease: 'power4',
					duration: 2,
					overwrite: true,
				})
			})
		})

		ScrollTrigger.addEventListener('refresh', calculatePositions)
	}
	setupLinks(document.querySelector('.right-content .inner-content'))

	var sections = Array.prototype.slice.call(document.querySelectorAll('.section'))
	sections.forEach(function (section, index) {
		ScrollTrigger.create({
			trigger: section,
			id: index + 1,
			start: 'top center',
			end: function end() {
				return '+='.concat(section.clientHeight - 30)
			},
			toggleActions: 'play reverse none reverse',
			toggleClass: {
				targets: section,
				className: 'is-active',
			},
			onToggle: function onToggle() {
				$('.m-menu .main-items a').removeClass('is-active')

				if (section.id != '') {
					$('.m-menu .main-items a[href*="#' + section.id + '"]').addClass('is-active')
				}
			},
		})
	})
}

/** 7. Contact Form
 *******************************************************************/

function contact_form() {
	$('#contact-form').submit(function (e) {
		e.preventDefault()

		var postdata = $(this).serializeArray(),
			pD_el_count = postdata.length

		for (var count = 0; count < pD_el_count; count++) {
			if ($("#contact-form input[name='" + postdata[count].name + "']").attr('data-require-filling') == 'true') {
				postdata.push({ name: postdata[count].name + '_required', value: true })
			} else {
				postdata.push({ name: postdata[count].name + '_required', value: false })
			}
		}

		$.ajax({
			type: 'POST',
			url: 'assets/php/contact.php',
			data: postdata,
			dataType: 'json',
			success: function (json) {
				$('#contact-form .error').removeClass('error')

				setTimeout(function () {
					if (json.nameMessage !== '') {
						$('#contact-form-name').addClass('error')
					}

					if (json.emailMessage !== '') {
						$('#contact-form-email').addClass('error')
					}

					if (json.messageMessage !== '') {
						$('#contact-form-message').addClass('error')
					}
				}, 25)

				if (json.succesMessage !== '') {
					$('#contact-form').addClass('success')
					$('#contact-form .button-area').css('display', 'none')
					$('#contact-form input,#contact-form textarea,#contact-form button').val('').prop('disabled', true)
				}
			},
		})
	})
}

/** 8. Scroll Bar / Progress Bar
 *******************************************************************/

function scroll_bar() {
	if (config_scroll_bar == 'default' || is_mobile_device == true) return

	var scroll_bars = {}

	function hide_default_scrollbar() {
		var styles = 'body::-webkit-scrollbar {display: none;} body {-ms-overflow-style: none;scrollbar-width: none; }:root{ scrollbar-width: none !important } '
		var styleSheet = document.createElement('style')
		styleSheet.innerText = styles
		document.head.appendChild(styleSheet)
	}

	scroll_bars.progress = function () {
		$('body').prepend('<div class="scroll-progress"><div class="inner"></div></div>')
		$('body').addClass('cursor-hidden')

		gsap.to('.scroll-progress .inner', {
			height: '100%',
			ease: 'none',
			scrollTrigger: {
				trigger: document.body,
				start: 'top top',
				end: 'bottom bottom',
				toggleClass: { targets: '.section', className: 'active' },
				scrub: 0,
				invalidateOnRefresh: true,
			},
		})
	}

	scroll_bars.bar = function () {
		var calc_out, content_h, window_h

		$('body').prepend('<div class="scroll-bar"><div class="inner"></div></div>')
		$('body').addClass('cursor-hidden')

		function calc() {
			window_h = $(window).height()
			content_h = $('.right-content .inner-content').height()
			calc_out = Math.round(100 / (content_h / window_h))
			$('.scroll-bar .inner').css('height', calc_out + '%')
		}
		calc()
		window.addEventListener('resize', calc)

		gsap.to('.scroll-bar .inner', {
			top: 100 - calc_out + '%',
			ease: 'none',
			scrollTrigger: {
				trigger: document.body,
				start: 'top top',
				end: 'bottom bottom',
				toggleClass: { targets: '.section', className: 'active' },
				scrub: 0,
				invalidateOnRefresh: true,
			},
		})
	}

	scroll_bars[config_scroll_bar]()
}

/** 9. Lightbox
 *******************************************************************/

function lightbox_setup() {
	var customLightboxHTML =
		'<div id="glightbox-body" class="glightbox-container hide-nav">' +
		'<div class="gloader visible"></div>' +
		'<div class="goverlay"></div>' +
		'<div class="gcontainer">' +
		'<div id="glightbox-slider" class="gslider"></div>' +
		'<button class="gnext gbtn" tabindex="0" aria-label="Next"><span class="ti-arrow-right"></span></button>' +
		'<button class="gprev gbtn" tabindex="1" aria-label="Previous"><span class="ti-arrow-left"></span></button>' +
		'<button class="gclose gbtn" tabindex="2" aria-label="Close"><span class="ti-close"></span></button>' +
		'</div>' +
		'</div>'

	var customSlideHTML =
		'<div class="gslide">' +
		'<div class="gslide-inner-content">' +
		'<div class="ginner-container">' +
		'<div class="gslide-content-frame">' +
		'<div class="gslide-media">' +
		'<div class="gslide-description">' +
		'<div class="gdesc-inner">' +
		'<h4 class="gslide-title"></h4>' +
		'<div class="gslide-desc"></div>' +
		'</div>' +
		'</div>' +
		'<div class="info-button"><div class="icon-button"><span class="ti-info"></span></div></div>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>'

	var work_lightbox_1 = GLightbox({
		selector: '.work-lightbox-1',
		touchNavigation: true,
		loop: false,
		zoomable: false,
		slideHTML: customSlideHTML,
		lightboxHTML: customLightboxHTML,
	})

	work_lightbox_1.on('open', function () {
		setTimeout(function () {
			$('.glightbox-container ').removeClass('hide-nav')
		}, 300)

		var block = false

		$('.gslide .info-button').on('click touchend', function () {
			if (block == true) return

			block = true
			var el = $(this).closest('.gslide')

			if (el.hasClass('show-desc')) {
				el.removeClass('show-desc')
				$(this).find('.icon-button span').removeClass('ti-close').addClass('ti-info')
			} else {
				el.addClass('show-desc')
				$(this).find('.icon-button span').removeClass('ti-info').addClass('ti-close')
			}

			setTimeout(function () {
				block = false
			}, 500)
		})
	})

	work_lightbox_1.on('slide_before_change', function () {
		$('.gslide').removeClass('show-desc')
		$('.gslide .info-button span').removeClass('ti-close').addClass('ti-info')
	})
}

/** 10. Scroll Animations
 *******************************************************************/

function scroll_animations() {
	if (config_scroll_animation_on_mobile == false && is_mobile_device) return

	var defaults = {
		duration: 1.2,
		ease: 'power4.out',
		animation: 'fade_from_bottom',
		once: false,
	}

	defaults = config_scroll_animation_defaults === 'undefined' ? defaults : config_scroll_animation_defaults

	gsap.utils.toArray('.scroll-animation').forEach(function (box) {
		var gsap_obj = {}

		var settings = {
			ease: box.dataset.animationEase || defaults.ease,
			duration: box.dataset.animationDuration || defaults.duration,
		}

		var animations = {
			fade_from_bottom: {
				y: 150,
				opacity: 0,
			},
			fade_from_left: {
				x: -150,
				opacity: 0,
			},
			fade_from_right: {
				x: 150,
				opacity: 0,
			},
			fade_in: {
				opacity: 0,
			},
			rotate_up: {
				y: 150,
				rotation: 10,
				opacity: 0,
			},
		}

		var scroll_trigger = {
			scrollTrigger: {
				trigger: box,
				once: defaults.once,
				start: 'top bottom+=5%',
				toggleActions: 'play none none reverse',
				markers: false,
			},
		}

		$.extend(gsap_obj, settings)
		$.extend(gsap_obj, animations[box.dataset.animation || defaults.animation])
		$.extend(gsap_obj, scroll_trigger)

		gsap.from(box, gsap_obj)
	})
}

/** 11. Profile Picture
 *******************************************************************/

function image_setup() {
	function img_three(opts) {
		var vertex = 'varying vec2 vUv;void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}'
		var fragment =
			'varying vec2 vUv;uniform float dispFactor;uniform float dpr;uniform sampler2D disp;uniform sampler2D texture1;uniform sampler2D texture2;uniform float angle1;uniform float angle2;uniform float intensity1;uniform float intensity2;uniform vec4 res;uniform vec2 parent;mat2 getRotM(float angle) {float s = sin(angle);float c = cos(angle);return mat2(c, -s, s, c);}void main() {vec4 disp = texture2D(disp, vUv);vec2 dispVec = vec2(disp.r, disp.g);vec2 uv = 0.5 * gl_FragCoord.xy / (res.xy) ;vec2 myUV = (uv - vec2(0.5))*res.zw + vec2(0.5);vec2 distortedPosition1 = myUV + getRotM(angle1) * dispVec * intensity1 * dispFactor;vec2 distortedPosition2 = myUV + getRotM(angle2) * dispVec * intensity2 * (1.0 - dispFactor);vec4 _texture1 = texture2D(texture1, distortedPosition1);vec4 _texture2 = texture2D(texture2, distortedPosition2);gl_FragColor = mix(_texture1, _texture2, dispFactor);}'

		function firstDefined() {
			for (var i = 0; i < arguments.length; i++) {
				if (arguments[i] !== undefined) return arguments[i]
			}
		}

		var parent = opts.parent
		var dispImage = opts.displacementImage
		var image = opts.image
		var imagesRatio = firstDefined(opts.imagesRatio, 1.0)
		var intensity1 = firstDefined(opts.intensity1, opts.intensity, 1)
		var intensity2 = firstDefined(opts.intensity2, opts.intensity, 1)
		var commonAngle = firstDefined(opts.angle, Math.PI / 4) // 45 degrees by default, so grayscale images work correctly
		var angle1 = firstDefined(opts.angle1, commonAngle)
		var angle2 = firstDefined(opts.angle2, -commonAngle * 3)
		var userHover = firstDefined(opts.hover, true)
		var easing = firstDefined(opts.easing, Expo.easeOut)

		var scene = new THREE.Scene()
		var camera = new THREE.OrthographicCamera(parent.offsetWidth / -2, parent.offsetWidth / 2, parent.offsetHeight / 2, parent.offsetHeight / -2, 1, 1000)

		camera.position.z = 1

		var renderer = new THREE.WebGLRenderer({
			antialias: false,
			alpha: true,
		})

		renderer.setPixelRatio(2.0)
		renderer.setClearColor(0xffffff, 0.0)
		renderer.setSize(parent.offsetWidth, parent.offsetHeight)
		parent.appendChild(renderer.domElement)

		var render = function () {
			renderer.render(scene, camera)
		}

		var loader = new THREE.TextureLoader()
		loader.crossOrigin = ''

		var disp = loader.load(dispImage)
		disp.magFilter = disp.minFilter = THREE.LinearFilter

		var disp_textures = {
			tech: { img_name: 'tech.jpg' },
			abstract: { img_name: 'abstract.jpg' },
			bricks: { img_name: 'bricks.jpg' },
			claw: { img_name: 'claw.jpg' },
			cult: { img_name: 'cult.jpg' },
			numbers: { img_name: 'numbers.jpg' },
			pieces: { img_name: 'pieces.jpg' },
			species: { img_name: 'species.jpg' },
			waves: { img_name: 'waves.jpg' },
		}

		$.each(disp_textures, function (key, value) {
			if (!$('.options-panel').length) return
			disp_textures[key].texture = loader.load('assets/images/effect_maps/' + this.img_name, function () {
				disp_textures[key].texture.magFilter = disp_textures[key].texture.magFilter = THREE.LinearFilter
			})
		})

		var texture = loader.load(image, function () {
			texture.magFilter = texture.magFilter = THREE.LinearFilter
			imagesRatio = texture.image.height / texture.image.width
			core()
			render()
		})

		function core() {
			let a1, a2
			var imageAspect = imagesRatio

			function set_aspect() {
				if (parent.offsetHeight / parent.offsetWidth < imageAspect) {
					a1 = 1
					a2 = parent.offsetHeight / parent.offsetWidth / imageAspect
				} else {
					a1 = (parent.offsetWidth / parent.offsetHeight) * imageAspect
					a2 = 1
				}
			}
			set_aspect()

			$('#option-hover .button').click(function () {
				btn_active = $(this).data('value')
				$('#option-hover .button.active').removeClass('active')
				$(this).addClass('active')
				mat.uniforms.disp.value = disp_textures[btn_active].texture
			})

			var mat = new THREE.ShaderMaterial({
				uniforms: {
					intensity1: {
						type: 'f',
						value: intensity1,
					},
					intensity2: {
						type: 'f',
						value: intensity2,
					},
					dispFactor: {
						type: 'f',
						value: 0.0,
					},
					angle1: {
						type: 'f',
						value: angle1,
					},
					angle2: {
						type: 'f',
						value: angle2,
					},
					texture1: {
						type: 't',
						value: texture,
					},
					texture2: {
						type: 't',
						value: texture,
					},
					disp: {
						type: 't',
						value: disp,
					},
					res: {
						type: 'vec4',
						value: new THREE.Vector4(parent.offsetWidth, parent.offsetHeight, a1, a2),
					},
					dpr: {
						type: 'f',
						value: window.devicePixelRatio,
					},
				},
				vertexShader: vertex,
				fragmentShader: fragment,
				transparent: true,
				opacity: 1.0,
			})

			document.addEventListener('keydown', function (event) {
				const key = event.key

				if (event.key == 'ArrowLeft') {
					mat.uniforms.disp.value = disp_2
					console.log('kk')
				}
			})

			var geometry = new THREE.PlaneBufferGeometry(parent.offsetWidth, parent.offsetHeight, 1)
			var object = new THREE.Mesh(geometry, mat)

			scene.add(object)

			function transitionIn() {
				gsap.to(mat.uniforms.dispFactor, {
					value: 1,
					duration: 1.6,
					ease: easing,
					overwrite: true,
					onUpdate: render,
					onComplete: render,
				})
			}

			function transitionOut() {
				gsap.to(mat.uniforms.dispFactor, {
					value: 0,
					duration: 1.2,
					ease: easing,
					overwrite: true,
					onUpdate: render,
					onComplete: render,
				})
			}

			if (userHover) {
				parent.addEventListener('mouseenter', transitionIn)
				parent.addEventListener('mouseleave', transitionOut)
				parent.addEventListener('touchstart', transitionIn)
				parent.addEventListener('touchend', transitionOut)
			}

			window.addEventListener('resize', function (e) {
				set_aspect()
				object.material.uniforms.res.value = new THREE.Vector4(parent.offsetWidth, parent.offsetHeight, a1, a2)
				renderer.setSize(parent.offsetWidth, parent.offsetHeight)
				render()
			})

			this.next = transitionIn
			this.previous = transitionOut
		}
	}

	$('.left-content .picture-box .picture').css('background-image', 'url(' + config_profile_image_url + ')')

	var map_url = 'assets/images/effect_maps/' + config_profile_image_effect + '.jpg'
	if (config_profile_image_effect == 'custom') map_url = config_profile_image_effect_url

	img_three({
		parent: document.querySelector('.picture-box'),
		intensity: config_profile_image_effect_intensity,
		image: config_profile_image_url,
		displacementImage: map_url,
	})
}

/** 12. Mobile
 *******************************************************************/

function mobile_layout() {
	var is_top = true

	ScrollTrigger.create({
		trigger: '.right-content .inner-content',
		id: 'mobile_layout',
		start: 'top center',
		end: 30,
		onLeave: function () {
			is_top = false

			if (!$('body').hasClass('mobile')) return

			gsap.to('.mobile .left-content', { duration: 0.1, zIndex: -2, overwrite: true })
			gsap.to('.mobile .left-content .inner-content', { duration: 0.86, opacity: 0.25, x: '-75%', rotateY: '50deg', ease: 'power3.inOut', zIndex: -2, overwrite: true })
			gsap.to('.mobile .left-content .inner-content .name', { duration: 0.4, opacity: 0, ease: 'power2.inOut', overwrite: true })
		},
		onEnterBack: function () {
			is_top = true

			if (!$('body').hasClass('mobile')) return

			gsap.to('.mobile .left-content', { duration: 0.1, zIndex: 2, overwrite: true })
			gsap.to('.mobile .left-content .inner-content', { duration: 0.86, opacity: 1, x: '0%', rotateY: '0', ease: 'power3.inOut', overwrite: true })
			gsap.to('.mobile .left-content .inner-content .name', { duration: 0.4, opacity: 1, ease: 'power2.inOut', overwrite: true })
		},
	}).disable()

	function resize() {
		if ($(window).width() < config_mobile_max_width_for_layout) {
			$('body').addClass('mobile')
			ScrollTrigger.getById('mobile_layout').enable()
			if (is_top) {
				gsap.to('.mobile .left-content', { duration: 0.1, zIndex: 2, overwrite: true })
				gsap.to('.mobile .left-content .inner-content', { duration: 0.86, opacity: 1, x: '0%', rotateY: '0', ease: 'power3.inOut', overwrite: true })
				gsap.to('.mobile .left-content .inner-content .name', { duration: 0.4, opacity: 1, ease: 'power2.inOut', overwrite: true })
			} else {
				gsap.to('.mobile .left-content', { duration: 0.1, zIndex: -2, overwrite: true })
				gsap.to('.mobile .left-content .inner-content', { duration: 0.86, opacity: 0.25, x: '-75%', rotateY: '50deg', ease: 'power3.inOut', zIndex: -2, overwrite: true })
				gsap.to('.mobile .left-content .inner-content .name', { duration: 0.4, opacity: 0, ease: 'power2.inOut', overwrite: true })
			}
		} else {
			$('body').removeClass('mobile')
			ScrollTrigger.getById('mobile_layout').disable()
			gsap.to('.left-content', { duration: 0.1, zIndex: 2, overwrite: true })
			gsap.to('.left-content .inner-content', { duration: 0.86, opacity: 1, x: '0%', rotateY: '5deg', ease: 'power3.inOut', overwrite: true })
			gsap.to('.left-content .inner-content .name', { duration: 0.4, opacity: 1, ease: 'power2.inOut', overwrite: true })
		}
	}
	resize()
	window.addEventListener('resize', resize)
}

/** 12. Misc
 *******************************************************************/

/* Scroll Down Function */
function scroll_down() {
	$('body').prepend('<div class="provoke-scroll-bottom"><div class="fill"><div class="inner"></div></div><div class="text"><p class="tag">SCROLL</p></div></div>')

	ScrollTrigger.create({
		trigger: '.right-content .inner-content',
		start: 'top center',
		end: 30,
		toggleClass: { targets: '.provoke-scroll-bottom', className: 'is-active' },
	})

	var tl_animation_fill = gsap.timeline({ repeat: -1 })

	tl_animation_fill.to('.provoke-scroll-bottom .fill .inner', { duration: 1.5, top: '100%', ease: 'power3.inOut' })
	tl_animation_fill.set('.provoke-scroll-bottom .fill .inner', { top: '-100%' })
	tl_animation_fill.to('.provoke-scroll-bottom .fill .inner', { duration: 1.5, top: '0%', ease: 'power3.inOut' })
}

// Set Colors
$('body').addClass('colors_' + config_color_scheme)

function options_panel() {
	if (is_mobile_device) return

	var panel_html =
		'<div class="open-options-panel noselect"><span class="ti-settings"></span></div>' +
		'<div class="options-panel noselect">' +
		'<div class="panel">' +
		'<div class="headline"><p>Configuration</p><div class="seperator-line m-t-2"></div></div>' +
		'<div class="option-grid m-t-6"></div>' +
		'</div>' +
		'<div class="panel-overlay"></div>' +
		'<span class="ti-close close-button"></span>' +
		'</div>'

	var option_color_html =
		'<div class="item" id="option-color">' +
		'<p class="tag">COLOR</p>' +
		'<div class="options">' +
		'<div class="option"><div class="color active" data-value="colors_warning_yellow"><div class="bg" style="background-color: #e3af00;"></div></div></div>' +
		'<div class="option"><div class="color" data-value="colors_future_blue"><div class="bg" style="background-color: #1338f3;"></div></div></div>' +
		'<div class="option"><div class="color" data-value="colors_dynamic_red"><div class="bg" style="background-color: #f31313;"></div></div></div>' +
		'<div class="option"><div class="color" data-value="colors_mystic_orange"><div class="bg" style="background-color: #ff6f1e;"></div></div></div>' +
		'<div class="option"><div class="color" data-value="colors_dreamy_turquoise"><div class="bg" style="background-color: #0bc5fc;"></div></div></div>' +
		'<div class="option"><div class="color" data-value="colors_polar_white"><div class="bg" style="background-color: #fff;"></div></div></div>' +
		'<div class="option"><div class="color" data-value="colors_sweet_purple"><div class="bg" style="background-color: #ff99cc;"></div></div></div>' +
		'<div class="option"><div class="color" data-value="colors_eco_green"><div class="bg" style="background-color: #0dd02e;"></div></div></div>' +
		'<div class="option"><div class="color" data-value="colors_acid_green"><div class="bg" style="background-color: #cceb00;"></div></div></div>' +
		'<div class="option"><div class="color" data-value="colors_coated_grey"><div class="bg" style="background-color: #c0c0c0;"></div></div></div>' +
		'</div>' +
		'</div>'

	var option_scrollbar_html =
		'<div class="item m-t-6" id="option-scrollbar">' +
		'<p class="tag">SCROLLBAR</p>' +
		'<div class="options">' +
		'<div class="option"><div class="button active" data-value="bar"><p class="small">Bar</p></div></div>' +
		'<div class="option"><div class="button" data-value="progress"><p class="small">Progress</p></div></div>' +
		'<div class="option"><div class="button" data-value="default"><p class="small">Default</p></div></div>' +
		'</div>' +
		'</div>'

	var option_hover_html =
		'<div class="item m-t-6" id="option-hover">' +
		'<p class="tag">HOVER EFFECT ( MAIN IMAGE )</p>' +
		'<div class="options">' +
		'<div class="option"><div class="button active" data-value="tech"><p class="small">Tech</p></div></div>' +
		'<div class="option"><div class="button" data-value="abstract"><p class="small">Abstract</p></div></div>' +
		'<div class="option"><div class="button" data-value="bricks"><p class="small">Bricks</p></div></div>' +
		'<div class="option"><div class="button" data-value="claw"><p class="small">Claw</p></div></div>' +
		'<div class="option"><div class="button" data-value="numbers"><p class="small">Numbers</p></div></div>' +
		'<div class="option"><div class="button" data-value="cult"><p class="small">Cult</p></div></div>' +
		'<div class="option"><div class="button" data-value="pieces"><p class="small">Pieces</p></div></div>' +
		'<div class="option"><div class="button" data-value="waves"><p class="small">Waves</p></div></div>' +
		'<div class="option"><div class="button" data-value="species"><p class="small">Species</p></div></div>' +
		'</div>' +
		'</div>'

	$('body').append(panel_html)
	$('.options-panel .option-grid').append(option_color_html)
	$('.options-panel .option-grid').append(option_scrollbar_html)
	$('.options-panel .option-grid').append(option_hover_html)

	function panel() {
		var tl_panel = gsap.timeline({})
		var lock = false

		function close() {
			if (lock == 1) return
			lock = true
			tl_panel.to('.options-panel .panel', { duration: 0.5, opacity: 0, ease: 'power2.inOut' })
			tl_panel.to('.options-panel', { duration: 0.5, opacity: 0, ease: 'power2.inOut' })
			tl_panel.set('.options-panel', { zIndex: -10000 })
			tl_panel.to('.open-options-panel', { duration: 0.2, x: '0', ease: 'power1.inOut' })
			tl_panel.call(function () {
				lock = false
			})
		}

		function open() {
			if (lock == 1) return
			lock = true
			tl_panel.to('.open-options-panel', { duration: 0.2, x: '-100%', ease: 'power1.inOut' })
			tl_panel.set('.options-panel', { zIndex: 100 })
			tl_panel.to('.options-panel', { duration: 0.5, opacity: 1, ease: 'power2.inOut' })
			tl_panel.to('.options-panel .panel', { duration: 0.5, opacity: 1, ease: 'power2.inOut' })
			tl_panel.call(function () {
				lock = false
			})
		}

		$('.open-options-panel').click(open)
		$('.panel-overlay').click(close)
		$('.options-panel .ti-close').click(close)
	}
	panel()

	function option_colors() {
		var last_color
		var upcoming_color

		$('.options-panel .color').click(function () {
			last_color = $('.options-panel .color.active').data('value')
			upcoming_color = $(this).data('value')

			$('.options-panel .color').removeClass('active')
			$(this).addClass('active')

			$('body').removeClass(last_color)
			$('body').addClass(upcoming_color)
		})
	}
	option_colors()

	function option_scrollbar() {
		config_scroll_bar = 'progress'
		window.addEventListener('load', scroll_bar())
		var btn_active = $('#option-scrollbar .button.active').data('value')

		function update(data) {
			switch (data) {
				case 'bar':
					$('body').addClass('cursor-hidden')
					gsap.set('.scroll-progress', { opacity: 0 })
					gsap.set('.scroll-bar', { opacity: 1 })
					break
				case 'progress':
					$('body').addClass('cursor-hidden')
					gsap.set('.scroll-progress', { opacity: 1 })
					gsap.set('.scroll-bar', { opacity: 0 })
					break
				case 'default':
					$('body').removeClass('cursor-hidden')
					gsap.set('.scroll-progress', { opacity: 0 })
					gsap.set('.scroll-bar', { opacity: 0 })
					break
				default:
			}
		}
		update(btn_active)

		$('#option-scrollbar .button').click(function () {
			btn_active = $(this).data('value')

			$('#option-scrollbar .button.active').removeClass('active')
			$(this).addClass('active')

			update(btn_active)
		})
	}
	option_scrollbar()
}
