"""Local preview server with HTTP Range support.

The site scrubs its background clips as canvas-painted JPEG sequences, not
seeked <video> elements (see js/main.js), so Range support isn't load-bearing
for that path anymore. It's kept here because the raw source clips in
media/*.mp4 are still plain <video>-seekable if opened directly, and Python's
stock `http.server` ignores Range headers entirely — it always returns the
whole file, which breaks video.currentTime seeking in every browser. Any real
host (Netlify, Vercel, GitHub Pages, S3, nginx) supports Range natively, so
this is only needed for local preview.

Usage: python3 serve.py [port]   (defaults to 8765)
"""

import http.server
import os
import re
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
ROOT = os.path.dirname(os.path.abspath(__file__))


class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()

        file_size = os.path.getsize(path)
        range_header = self.headers.get("Range")
        if not range_header:
            self.send_response(200)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-type", self.guess_type(path))
            self.send_header("Content-Length", str(file_size))
            self.end_headers()
            return open(path, "rb")

        match = re.match(r"bytes=(\d*)-(\d*)", range_header)
        start_s, end_s = match.groups()
        start = int(start_s) if start_s else 0
        end = int(end_s) if end_s else file_size - 1
        end = min(end, file_size - 1)
        length = end - start + 1

        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
        self.send_header("Content-Length", str(length))
        self.end_headers()
        return _LimitedReader(f, length)


class _LimitedReader:
    def __init__(self, f, length):
        self.f = f
        self.remaining = length

    def read(self, size=-1):
        if self.remaining <= 0:
            return b""
        if size < 0 or size > self.remaining:
            size = self.remaining
        chunk = self.f.read(size)
        self.remaining -= len(chunk)
        return chunk

    def close(self):
        self.f.close()


if __name__ == "__main__":
    server = http.server.HTTPServer(("localhost", PORT), RangeHTTPRequestHandler)
    print(f"Serving {ROOT} at http://localhost:{PORT}/ (Range requests supported)")
    server.serve_forever()
