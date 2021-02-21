import asyncio
import websockets
import os
from http import HTTPStatus
import json
import time


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
    print("New WebSocket connection from", websocket.remote_address)
    while websocket.open:
        data = json.loads(await websocket.recv())
        print(data)
        with open('/dev/ttyACM0', 'wb') as f:
            for i, value in enumerate(data):
                if i % 10 == 0:
                    print(round(i / 1920 * 100))
                if value is not None:
                    f.write(bytes([round(value * 255), 1]))
                    f.flush()
                time.sleep(0.01)
    # This print will not run when abrnomal websocket close happens
    # for example when tcp connection dies and no websocket close frame is sent
    print("WebSocket connection closed for", websocket.remote_address)


data = [[None] * 1920 for _ in range(4)]
playing = False
looping = False
position = 0
period = 16

# This will run in a separate thread.
# def play():
#     while True:
#         if not playing:
#             time.sleep(0.1)
#             continue
#         data[pos]


start_server = websockets.serve(serve, "0.0.0.0", 8765, process_request=process_request)

if __name__ == '__main__':
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()