import pathlib

import tornado.web


class IndexHandler(tornado.web.RequestHandler):
    def get(self) -> None:
        self.add_header("Content-Type", "text/html")
        self.write(pathlib.Path("index.html").read_bytes())


class MyStaticFileHandler(tornado.web.StaticFileHandler):
    def get_content_type(self) -> str:
        path_suffix = pathlib.Path(self.absolute_path).suffix
        if path_suffix == ".js":
            return "application/javascript"
        return super().get_content_type()


current_path = pathlib.Path(__file__).parent
app = tornado.web.Application(
    [
        (r'^/$', IndexHandler),
        (r'^/(.+)$', MyStaticFileHandler, {"path": current_path}),
    ],
    static_path=current_path,
)

if __name__ == '__main__':
    app.listen(8080, '127.0.0.1')
    print("Starting server on http://127.0.0.1:8080")
    tornado.ioloop.IOLoop.current().start()
