import asyncio
import websockets
import os
from http import HTTPStatus
import json
import time
import threading


MIME_TYPES = {
    "html": "text/html",
    "js": "text/javascript",
    "css": "text/css"
}

SERVER_ROOT = os.path.join(os.getcwd(), 'client')


# https://gist.github.com/artizirk/04eb23d957d7916c01ca632bb27d5436
async def process_request(path, request_headers):
    """Serves a file when doing a GET request with a valid path."""

    print(request_headers)
    if "Upgrade" in request_headers:
        return  # Probably a WebSocket connection

    if path == '/':
        path = '/index.html'

    response_headers = [
        ('Server', 'asyncio websocket server'),
        ('Connection', 'close'),
    ]

    # Derive full system path
    full_path = os.path.realpath(os.path.join(SERVER_ROOT, path[1:]))

    # Validate the path
    if os.path.commonpath((SERVER_ROOT, full_path)) != SERVER_ROOT or \
            not os.path.exists(full_path) or not os.path.isfile(full_path):
        print("HTTP GET {} 404 NOT FOUND".format(path))
        return HTTPStatus.NOT_FOUND, [], b'404 NOT FOUND'

    # Guess file content type
    extension = full_path.split(".")[-1]
    mime_type = MIME_TYPES.get(extension, "application/octet-stream")
    response_headers.append(('Content-Type', mime_type))

    # Read the whole file into memory and send it out
    body = open(full_path, 'rb').read()
    response_headers.append(('Content-Length', str(len(body))))
    print("HTTP GET {} 200 OK".format(path))
    return HTTPStatus.OK, response_headers, body


async def serve(websocket, path):
    global data, playing, loop, period, start_time, ticks
    print("New WebSocket connection from", websocket.remote_address)
    while websocket.open:
        message = json.loads(await websocket.recv())
        if message['type'] == 'data':
            data = message['payload']
        elif message['type'] == 'play':
            if message['payload']:
                start_time = time.time()
                ticks = 0
            playing = message['payload']
        elif message['type'] == 'loop':
            loop = message['payload']
        elif message['type'] == 'period':
            if playing:
                start_time = time.time()
                ticks = 0
            period = message['payload']
        # print(data)
        # with open('/dev/ttyACM0', 'wb') as f:
        #     for i, value in enumerate(data):
        #         if i % 10 == 0:
        #             print(round(i / 1920 * 100))
        #         if value is not None:
        #             f.write(bytes([round(value * 255), 1]))
        #             f.flush()
        #         time.sleep(0.01)
    # This print will not run when abrnomal websocket close happens
    # for example when tcp connection dies and no websocket close frame is sent
    print("WebSocket connection closed for", websocket.remote_address)


data = [[None] * 1920 for _ in range(4)]
playing = False
loop = False
pos = 0
period = 16
start_time = 0
ticks = 0

# This will run in a separate thread.
def play():
    global playing, pos, ticks
    f = None
    try:
        f = open('/dev/ttyACM0', 'wb')
    except PermissionError:
        print("Arduino disconnected, printing values instead.")
    while True:
        if not playing:
            time.sleep(0.1)
            continue
        chunk = bytes([round((data[i][pos] or 0) * 255) for i in range(4)])
        if f:
            f.write(chunk)
            f.flush()
        print(' '.join(f'{x:02X}' for x in chunk))
        pos += 1
        if pos >= len(data[0]):
            if loop:
                pos %= len(data[0])
            else:
                pos = 0
                playing = False
        ticks += 1
        # We should be at `start_time + period / len(data[0]) * steps`.
        t = time.time()
        target = start_time + period / len(data[0]) * ticks
        delta = target - t
        # print(start_time, target, t, period, period / len(data[0]), ticks, delta)
        if delta < 0:
            print(f"Warning: {delta}s behind schedule.")
        else:
            time.sleep(delta)


play_thread = threading.Thread(target=play)
play_thread.start()


start_server = websockets.serve(serve, "0.0.0.0", 8765, process_request=process_request)

if __name__ == '__main__':
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()