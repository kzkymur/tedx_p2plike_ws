import http from 'http';
import url from 'url';
import fs from 'fs';
const server = http.createServer();
const port = process.env.PORT || 8080;

const getType = (_url) => {
  //拡張子をみて一致したらタイプを返す関数
  const types = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "svg+xml"
  }
  for (let key in types) {
    if (_url.endsWith(key)) {
      return types[key];
    }
  }
  return "text/plain";
}

server.on('request', function (req, res) {
	const Response = {
		"renderHTML": () => {
			const template = fs.readFile('./index.html', 'utf-8', function (err, data) {
				if (!err) {
					res.writeHead(200, { 'content-Type': 'text/html' });
					res.write(data);
					res.end();
				}
			});
		},
		"websocket": () => {
			const template = fs.readFile('./src/websocket.js', 'utf-8', function (err, data) {
				if (!err) {
					res.writeHead(200, { 'content-Type': 'text/javascript' }); 
					res.write(data);
					res.end();
				}
			})
		},
		"build": () => {
			const template = fs.readFile('./build.js', 'utf-8', function (err, data) {
				if (!err) {
					res.writeHead(200, { 'content-Type': 'text/javascript' });
					res.write(data);
					res.end();
				}
			})
		},
		"media": uri => {
			fs.readFile(`.${uri}`, (err, data) => {
				if (!err) {
					res.writeHead(200, {"content-type": getType(uri)}); 
					res.end(data);
				}
			});
		}
	};
	// urlのpathをuriに代入
	const uri = url.parse(req.url).pathname;
	if (uri === "/") {
		Response["renderHTML"](); 
	} else if (uri === "/src/websocket.js") {
		Response["websocket"](); 
	} else if (uri === "/build.js") {
		Response["build"](); 
	} else if (uri.indexOf("media")!==-1){
		Response["media"](uri); 
	};
});

server.listen(port)
console.log('Server running at http://localhost:'+port);

