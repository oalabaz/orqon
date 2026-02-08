function circleBackground() {
    var canvas = document.getElementById('main').appendChild(document.createElement('canvas'))
    var context = canvas.getContext('2d')

    var time = 0,
        velocity = 0.1,
        velocityTarget = option_hero_background_circle_speed,
        width,
        height,
        lastX,
        lastY

    var MAX_OFFSET = 400
    var SPACING = 5
    var POINTS = MAX_OFFSET / SPACING
    var PEAK = MAX_OFFSET * 0.25
    var POINTS_PER_LAP = 6
    var SHADOW_STRENGTH = 15

    // Mouse interaction
    var mouseX = 0
    var mouseY = 0
    var targetMouseX = 0
    var targetMouseY = 0

    canvas.setAttribute('id', 'canvas-circle')
    setup()

    $('#canvas-circle').css('opacity', option_hero_background_circle_scene_opacity)
    $('body').append('<div class="bg-color" style="background-color:' + option_hero_background_circle_bg_color + '"></div>')

    function setup() {
        resize()
        step()
        window.addEventListener('resize', resize)
        window.addEventListener('mousemove', onMouseMove)
    }

    function resize() {
        width = canvas.width = window.innerWidth
        height = canvas.height = window.innerHeight
    }

    function onMouseMove(e) {
        targetMouseX = (e.clientX - width / 2) * 0.5
        targetMouseY = (e.clientY - height / 2) * 0.5
    }

    function step() {
        time += velocity
        velocity += (velocityTarget - velocity) * 0.3

        // Smooth mouse movement
        mouseX += (targetMouseX - mouseX) * 0.05
        mouseY += (targetMouseY - mouseY) * 0.05

        clear()
        render()

        requestAnimationFrame(step)
    }

    function clear() {
        context.clearRect(0, 0, width, height)
    }

    function render() {
        var x,
            y,
            cx = width / 2,
            cy = height / 2

        context.globalCompositeOperation = 'lighter'

        // Create gradient
        var gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, option_hero_background_circle_line_color); // Config color
        gradient.addColorStop(0.5, '#4facfe'); // Blue
        gradient.addColorStop(1, '#ff0055'); // Pink

        context.strokeStyle = gradient
        context.shadowColor = option_hero_background_circle_line_color
        // context.lineWidth = 2 // Moved to loop for dynamic width
        context.beginPath()

        for (var i = POINTS; i > 0; i--) {
            var value = i * SPACING + (time % SPACING)

            var ax = Math.sin(value / POINTS_PER_LAP) * Math.PI,
                ay = Math.cos(value / POINTS_PER_LAP) * Math.PI

                ; (x = ax * value), (y = ay * value * 0.35)

            var o = 1 - Math.min(value, PEAK) / PEAK

            y -= Math.pow(o, 2) * 200
            y += (200 * value) / MAX_OFFSET
            y += (x / cx) * width * 0.1

            // Mouse interaction distortion
            var dist = Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(y - mouseY, 2))
            if (dist < 200) {
                var force = (200 - dist) / 200
                x += (x - mouseX) * force * 0.2
                y += (y - mouseY) * force * 0.2
            }

            context.globalAlpha = 1 - value / MAX_OFFSET
            context.shadowBlur = SHADOW_STRENGTH * o

            // Optimization: Simulate bokeh with line width instead of expensive filter
            // Distant lines (higher value) are thicker but more transparent
            var depth = value / MAX_OFFSET;
            context.lineWidth = 2 + (depth * 6);

            context.lineTo(cx + x, cy + y)
            context.stroke()

            context.beginPath()
            context.moveTo(cx + x, cy + y)
        }

        context.lineWidth = 2;
        context.lineTo(cx, cy - 200)
        context.lineTo(cx, 0)
        context.stroke()
    }
}
