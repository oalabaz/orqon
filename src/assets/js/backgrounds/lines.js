function linesBackground() {
    const canvas = document.getElementById('main').appendChild(document.createElement('canvas'))
    const context = canvas.getContext('2d')

    const lines = []

    var step = 0,
        width = 0,
        height = 0

    window.onresize = setup

    canvas.setAttribute('id', 'canvas-lines')

    setup()
    update()

    $('#canvas-lines').css({
        opacity: option_hero_background_lines_scene_opacity,
        transform: 'translate(-50%, -50%) rotate(45deg)',
        left: '50%',
        top: '50%',
    })
    $('body').append('<div class="bg-color" style="background-color:' + option_hero_background_lines_bg_color + '"></div>')

    function setup() {
        width = height = Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2))

        lines.length = 0

        let lineCount = height / 26
        let pointCount = 14
        let spacingH = width / pointCount
        let spacingV = height / lineCount

        for (let v = 0; v < lineCount; v++) {
            let line = { points: [], ran: 0.2 + Math.random() * 0.7 }

            for (let h = 0; h < pointCount; h++) {
                line.points.push({
                    nx: h * spacingH,
                    ny: v * spacingV,
                })
            }

            line.points.push({
                nx: width + spacingH,
                ny: v * spacingV,
            })

            lines.push(line)
        }
    }

    function update() {
        step += 0.8

        canvas.width = width
        canvas.height = height

        context.clearRect(0, 0, width, height)

        context.lineWidth = 2
        context.strokeStyle = option_hero_background_lines_line_color
        context.fillStyle = option_hero_background_lines_bg_color

        lines.forEach(function (line, v) {
            context.beginPath()

            line.points.forEach(function (point, h) {
                ; (point.x = point.nx), (point.y = point.ny + Math.sin((point.x * line.ran + (step + point.ny)) / 40) * (6 + (point.ny / height) * 34))
            })

            line.points.forEach(function (point, h) {
                var nextPoint = line.points[h + 1]

                if (h === 0) {
                    context.moveTo(point.x, point.y)
                } else if (nextPoint) {
                    var cpx = point.x + (nextPoint.x - point.x) / 2
                    var cpy = point.y + (nextPoint.y - point.y) / 2
                    context.quadraticCurveTo(point.x, point.y, cpx, cpy)
                }
            })

            context.stroke()
            context.lineTo(width, height)
            context.lineTo(0, height)
            context.closePath()
            context.fill()
        })

        requestAnimationFrame(update)
    }
}
