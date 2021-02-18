const canvas = document.querySelector("canvas")
const context = canvas.getContext("2d")
context.strokeStyle = "#ff0000"
context.lineJoin = "round"
context.lineWidth = 5

const clickX = []
const clickY = []
const clickDrag = []
let paint = false

window.onload = window.onresize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    redraw()
}

document.querySelector("button").onclick = () => {
    const el = canvas
    if (el.requestFullscreen) {
        el.requestFullscreen()
    } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen()
    } else if (el.webkitRequestFullScreen) {
        el.webkitRequestFullScreen()
    } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen()
    }

    document.querySelector(".start-screen").hidden = true
    document.querySelector("canvas").hidden = false
}

const addClick = (x, y, dragging) => {
    clickX.push(x)
    clickY.push(y)
    clickDrag.push(dragging)
}

const redraw = () => {
    // Clears the canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)

    for (var i = 0; i < clickX.length; i += 1) {
        if (!clickDrag[i] && i == 0) {
            context.beginPath()
            context.moveTo(clickX[i], clickY[i])
            context.stroke()
        } else if (!clickDrag[i] && i > 0) {
            context.closePath()

            context.beginPath()
            context.moveTo(clickX[i], clickY[i])
            context.stroke()
        } else {
            context.lineTo(clickX[i], clickY[i])
            context.stroke()
        }
    }
}

const drawNew = () => {
    const i = clickX.length - 1
    if (!clickDrag[i]) {
        if (clickX.length == 0) {
            context.beginPath()
            context.moveTo(clickX[i], clickY[i])
            context.stroke()
        } else {
            context.closePath()

            context.beginPath()
            context.moveTo(clickX[i], clickY[i])
            context.stroke()
        }
    } else {
        context.lineTo(clickX[i], clickY[i])
        context.stroke()
    }
}

const mouseDownEventHandler = (e) => {
    paint = true
    const x = e.pageX - canvas.offsetLeft
    const y = e.pageY - canvas.offsetTop
    if (paint) {
        addClick(x, y, false)
        drawNew()
    }
}

const touchstartEventHandler = (e) => {
    paint = true
    if (paint) {
        addClick(e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop, false)
        drawNew()
    }
}

const mouseUpEventHandler = (e) => {
    context.closePath()
    paint = false
}

const mouseMoveEventHandler = (e) => {
    const x = e.pageX - canvas.offsetLeft
    const y = e.pageY - canvas.offsetTop
    if (paint) {
        addClick(x, y, true)
        drawNew()
    }
}

function touchMoveEventHandler(e) {
    if (paint) {
        addClick(e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop, true)
        drawNew()
    }
}

function setUpHandler(isMouseandNotTouch, detectEvent) {
    removeRaceHandlers()
    if (isMouseandNotTouch) {
        canvas.addEventListener('mouseup', mouseUpEventHandler)
        canvas.addEventListener('mousemove', mouseMoveEventHandler)
        canvas.addEventListener('mousedown', mouseDownEventHandler)
        mouseDownEventHandler(detectEvent)
    } else {
        canvas.addEventListener('touchstart', touchstartEventHandler)
        canvas.addEventListener('touchmove', touchMoveEventHandler)
        canvas.addEventListener('touchend', mouseUpEventHandler)
        touchstartEventHandler(detectEvent)
    }
}

function mouseWins(e) {
    setUpHandler(true, e);
}

function touchWins(e) {
    setUpHandler(false, e);
}

function removeRaceHandlers() {
    canvas.removeEventListener('mousedown', mouseWins)
    canvas.removeEventListener('touchstart', touchWins)
}

canvas.addEventListener('mousedown', mouseWins)
canvas.addEventListener('touchstart', touchWins)