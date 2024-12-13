import mimetypes
import pathlib

import tornado.web


class IndexHandler(tornado.web.RequestHandler):
    def get(self) -> None:
        self.add_header("Content-Type", "text/html")
        self.write(pathlib.Path("dist/index.html").read_bytes())

mimetypes.add_type("application/javascript", ".js")
current_path = pathlib.Path(__file__).parent / "dist"
app = tornado.web.Application(
    [
        (r'^/$', IndexHandler),
        (r'^/(.+)$', tornado.web.StaticFileHandler, {"path": current_path}),
    ],
    static_path=current_path,
)

if __name__ == '__main__':
    app.listen(8000, '127.0.0.1')
    print("Starting server on http://127.0.0.1:8000")
    tornado.ioloop.IOLoop.current().start()