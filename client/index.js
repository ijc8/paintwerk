const canvas = document.querySelector("canvas")
const context = canvas.getContext("2d")
context.strokeStyle = "#ff0000"
context.lineJoin = "round"
context.lineWidth = 5

let data = Array(canvas.width).fill(null)
let paint = false

socket = new WebSocket("ws://localhost:8765")

window.onload = window.onresize = () => {
    console.log("resize")
    data = data.map(y => y ? (y * window.innerHeight / canvas.height) : y)
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    redraw()
}

document.querySelector("button.start").onclick = () => {
    const el = document.querySelector(".canvas")
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
    document.querySelector(".canvas").hidden = false
}

document.querySelector("button.clear").onclick = () => {
    data.fill(null)
    redraw()
}

document.querySelector("button.submit").onclick = () => {
    socket.send(JSON.stringify(data.map(y => y ? 1 - Math.min(1, y / canvas.height) : null)))
}

let lastPoint = null

const addClick = (x, y, dragging) => {
    if (dragging) {
        let start, end;
        if (x < lastPoint[0]) {
            start = [x, y]
            end = lastPoint
        } else {
            start = lastPoint
            end = [x, y]
        }
        for (let i = 0; i <= end[0] - start[0]; i++) {
            data[start[0] + i] = start[1] + (end[1] - start[1]) * (i / (end[0] - start[0]))
        }
        data[x] = y
    }

    lastPoint = [x, y]
}

const redraw = () => {
    // Clears the canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)

    context.beginPath()
    for (let i = 0; i < data.length; i++) {
        if (data[i] === null) {
            context.closePath()
            context.beginPath()
        } else {
            context.lineTo(i, data[i])
            context.stroke()
        }
    }
    context.closePath()
}

const mouseDownEventHandler = (e) => {
    paint = true
    const x = e.pageX - canvas.offsetLeft
    const y = e.pageY - canvas.offsetTop
    addClick(x, y, false)
    redraw()
}

const touchStartEventHandler = (e) => {
    console.log("start!")
    paint = true
    addClick(e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop, false)
    redraw()
}

const mouseUpEventHandler = (e) => {
    console.log("end!")
    paint = false
}

const mouseMoveEventHandler = (e) => {
    if (paint) {
        addClick(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop, true)
        redraw()
    }
}

function touchMoveEventHandler(e) {
    if (paint) {
        console.log("drag!", e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop)
        addClick(Math.round(e.touches[0].pageX - canvas.offsetLeft), Math.round(e.touches[0].pageY - canvas.offsetTop), true)
        redraw()
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
        canvas.addEventListener('touchstart', touchStartEventHandler)
        canvas.addEventListener('touchmove', touchMoveEventHandler)
        canvas.addEventListener('touchend', mouseUpEventHandler)
        touchStartEventHandler(detectEvent)
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