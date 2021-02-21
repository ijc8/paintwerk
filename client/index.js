const canvas = document.querySelector("canvas")
const context = canvas.getContext("2d")

const colors = ["#ff714d", "#058fee", "#4ec921", "#aaaaaa"]
let data = Array(4).fill(0).map(() => Array(canvas.width).fill(null))
let selectedColors = [0]
let paint = false
let loop = false
let playing = false
let playheadPos = 0

socket = new WebSocket("ws://localhost:8765")

window.onload = window.onresize = () => {
    console.log("resize")
    data = data.map(row => row.map(y => y ? (y * window.innerHeight / canvas.height) : y))
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

const loopButton = document.querySelector("button.loop")
loopButton.onclick = (e) => {
    if (loop) {
        loop = false
        loopButton.classList.remove("selected")
    } else {
        loop = true
        loopButton.classList.add("selected")
    }
}

document.querySelector("button.clear").onclick = () => {
    data.forEach(row => row.fill(null))
    redraw()
}

const playButton = document.querySelector("button.play")
playButton.onclick = () => playing ? pause() : play()

let period = 16

const periodInput = document.querySelector("input.rate")
periodInput.value = period
periodInput.onchange = () => {
    period = parseFloat(document.querySelector("input.rate").value) || period
}

let lastTime = null

const playhead = document.querySelector(".playhead")
const updatePlayhead = () => {
    const time = Date.now()
    playheadPos += (time - lastTime) / 1000 / period * canvas.width
    lastTime = time
    if (playheadPos >= canvas.width) {
        if (loop) {
            playheadPos %= canvas.width
        } else {
            stop()
        }
    }
    playhead.style.left = playheadPos + "px"
}

let playheadInterval = null

const play = () => {
    socket.send(JSON.stringify(data.map(row => row.map(y => y ? 1 - Math.min(1, y / canvas.height) : null))))
    lastTime = Date.now()
    playButton.children[0].innerText = "pause"
    playheadInterval = setInterval(updatePlayhead, 10)
    playing = true
    playhead.hidden = false
}

const pause = () => {
    playButton.children[0].innerText = "play_arrow"
    playing = false
    clearInterval(playheadInterval)
}

const stop = () => {
    playButton.children[0].innerText = "play_arrow"
    playing = false
    playheadPos = 0
    clearInterval(playheadInterval)
    playhead.hidden = true
}

const paletteButtons = document.querySelectorAll(".palette button")
paletteButtons.forEach((el, index) => {
    el.style.backgroundColor = colors[index]
    if (selectedColors.includes(index)) el.classList.add("selected")
    el.onclick = (event) => {
        console.log(event)
        paletteButtons.forEach(e => e.classList.remove("selected"))
        // el.classList.add("selected")
        // color = index
        if (event.ctrlKey) {
            if (selectedColors.includes(index)) {
                selectedColors = selectedColors.filter(i => i !== index)
            } else {
                selectedColors.push(index)
            }
        } else {
            selectedColors = [index]
        }
        selectedColors.forEach(color => paletteButtons[color].classList.add("selected"))
    }
})

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
            selectedColors.forEach(color => data[color][start[0] + i] = start[1] + (end[1] - start[1]) * (i / (end[0] - start[0])))
        }
        selectedColors.forEach(color => data[color][x] = y)
    }

    lastPoint = [x, y]
}

const redraw = () => {
    // console.log("redraw")
    // context.lineJoin = "round"
    context.lineWidth = 3
    // Clears the canvas
    context.globalCompositeOperation = "lighten"
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    // context.fillStyle = "#000000"
    // context.fillRect(0, 0, context.canvas.width, context.canvas.height)

    for (let color = 0; color < data.length; color++) {
        context.strokeStyle = colors[color]
        context.beginPath()
        for (let i = 0; i < data[color].length; i++) {
            if (data[color][i] === null) {
                // context.closePath()
                context.beginPath()
            } else {
                context.lineTo(i, Math.round(data[color][i]))
                context.stroke()
            }
        }
        // context.closePath()
    }
}

const mouseDownEventHandler = (e) => {
    paint = true
    const x = e.pageX - canvas.offsetLeft
    const y = e.pageY - canvas.offsetTop
    addClick(x, y, false)
}

const touchStartEventHandler = (e) => {
    console.log("start!")
    paint = true
    addClick(e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop, false)
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