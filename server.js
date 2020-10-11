import http from 'http';
import url from 'url';
import fs from 'fs';
const server = http.createServer();
const port = 8081;

server.on('request', function (req, res) {
	const Response = {
		"renderHTML": () => {
			const template = fs.readFile('./index.html', 'utf-8', function (err, data) {
				res.writeHead(200, {
					'content-Type': 'text/html'
				});

				res.write(data);
				res.end("HTML file has already sent to browser");

			});

		},
		"websocket": () => {
			const template = fs.readFile('./src/websocket.js', 'utf-8', function (err, data) {
				res.writeHead(200, {
					'content-Type': 'text/javascript'
				});

				res.write(data);
				res.end();
			})
		}
	};
	// urlのpathをuriに代入
	const uri = url.parse(req.url).pathname;

	if (uri === "/") {
		Response["renderHTML"](); 
		return;
	} else if (uri === "/src/websocket.js") {
		Response["websocket"](); 
		return;
	};
});

server.listen(port)
console.log('Server running at http://localhost:'+port);

