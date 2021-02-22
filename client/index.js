const canvas = document.querySelector("canvas")
const context = canvas.getContext("2d")

// VCA, VCF, VCO, LFO
const colors = ["#aaaaaa", "#ff714d", "#058fee", "#4ec921"]
let data = Array(4).fill(0).map(() => Array(canvas.width).fill(null))
let selectedColors = [0]
let paint = false
let loop = false
let playing = false
let playheadPos = 0
let hasMouse = !window.matchMedia("(pointer:coarse)").matches

socket = new WebSocket("ws://" + location.host)
socket.onmessage = (message) => {
    message = JSON.parse(message.data)
    console.log(message)
    if (message.type === "data") {
        data = message.payload.map(row => row.map(x => x === null ? null : (1 - x) * canvas.height))
        redraw()
    } else if (message.type === "play") {
        playheadPos = message.position
        // TODO: reduce duplication
        if (message.payload) {
            lastTime = Date.now()
            playButton.children[0].innerText = "pause"
            playheadInterval = setInterval(updatePlayhead, 10)
            playing = true
            playhead.hidden = false
        } else {
            playButton.children[0].innerText = "play_arrow"
            playing = false
            clearInterval(playheadInterval)
        }
    } else if (message.type === "period") {
        period = message.payload
        periodInput.value = period
    } else if (message.type === "loop") {
        loop = message.payload
        if (loop) loopButton.classList.add("selected")
        else loopButton.classList.remove("selected")
    }
}

const send = (obj) => {
    // console.log("sending", obj)
    socket.send(JSON.stringify(obj))
}

// window.onload = window.onresize = () => {
//     // console.log("resize")
//     data = data.map(row => row.map(y => y ? (y * window.innerHeight / canvas.height) : y))
//     canvas.width = window.innerWidth
//     canvas.height = window.innerHeight
//     redraw()
// }

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
    send({type: "loop", payload: loop})
}

document.querySelector("button.clear").onclick = () => {
    data.forEach(row => row.fill(null))
    dirty = true
    redraw()
}

const playButton = document.querySelector("button.play")
playButton.onclick = () => playing ? pause() : play()

let period = 16

const periodInput = document.querySelector("input.rate")
periodInput.value = period
periodInput.onchange = () => {
    let value = parseFloat(periodInput.value)
    if (value) {
        period = value
        send({type: 'period', payload: period})
    } else {
        periodInput.value = period
    }
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
    playhead.style.left = (playheadPos/canvas.width*100) + "%"
}

let playheadInterval = null

const play = () => {
    send({type: 'play', payload: true, position: playheadPos})
    lastTime = Date.now()
    playButton.children[0].innerText = "pause"
    playheadInterval = setInterval(updatePlayhead, 10)
    playing = true
    playhead.hidden = false
}

const pause = () => {
    send({type: 'play', payload: false, position: playheadPos})
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
        // console.log(event)
        paletteButtons.forEach(e => e.classList.remove("selected"))
        // el.classList.add("selected")
        // color = index
        if (event.ctrlKey || !hasMouse) {
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
let dirty = false

const updateServerData = () => {
    if (dirty) {
        send({type: 'data', payload: data.map(row => row.map(y => y ? 1 - Math.min(1, y / canvas.height) : null))})
        dirty = false
    }
}

// Update server data every 500ms.
setInterval(updateServerData, 500)

const addClick = (x, y, dragging) => {
    x = Math.round(x)
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
        dirty = true
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
                context.stroke()
                context.beginPath()
            } else {
                context.lineTo(i, Math.round(data[color][i]))
            }
        }
        context.stroke()
        // context.closePath()
    }
}

const mouseDownEventHandler = (e) => {
    paint = true
    const x = (e.pageX - canvas.offsetLeft) * canvas.width / canvas.clientWidth
    const y = (e.pageY - canvas.offsetTop) * canvas.height / canvas.clientHeight
    addClick(x, y, false)
}

const touchStartEventHandler = (e) => {
    // console.log("start!")
    paint = true
    const x = (e.touches[0].pageX - canvas.offsetLeft) * canvas.width / canvas.clientWidth
    const y = (e.touches[0].pageY - canvas.offsetTop) * canvas.height / canvas.clientHeight
    addClick(x, y, false)
}

const mouseUpEventHandler = (e) => {
    // console.log("end!")
    paint = false
}

const mouseMoveEventHandler = (e) => {
    if (paint) {
        const x = (e.pageX - canvas.offsetLeft) * canvas.width / canvas.clientWidth
        const y = (e.pageY - canvas.offsetTop) * canvas.height / canvas.clientHeight
        addClick(x, y, true)
        redraw()
    }
}

function touchMoveEventHandler(e) {
    if (paint) {
        // console.log("drag!", e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop)
        const x = (e.touches[0].pageX - canvas.offsetLeft) * canvas.width / canvas.clientWidth
        const y = (e.touches[0].pageY - canvas.offsetTop) * canvas.height / canvas.clientHeight
        addClick(x, y, true)
        redraw()
    }
}

function setUpHandler(detectEvent) {
    canvas.removeEventListener('mousedown', mouseWins)
    canvas.removeEventListener('touchstart', touchWins)
    if (hasMouse) {
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
    hasMouse = true
    setUpHandler(e)
}

function touchWins(e) {
    hasMouse = false
    setUpHandler(e)
}

canvas.addEventListener('mousedown', mouseWins)
canvas.addEventListener('touchstart', touchWins)