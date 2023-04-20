import { WebSocket, WebSocketServer }  from 'ws';
import net  from 'net';

function throttle(func, ms) {
	let isThrottled = false,
	savedArgs,
	savedThis;

	function reload() {
		if (isThrottled) {
			savedArgs = arguments;
			savedThis = this;
			return;
		}

		func.apply(this, arguments);

		isThrottled = true;

		setTimeout(function() {
			isThrottled = false;

			if (savedArgs) {
				reload.apply(savedThis, savedArgs);
				savedArgs = savedThis = null;
			}
		}, ms);
	}

	return reload;
}

// TODO: replace to yargs package
function checkParam(params, name) {
	return params.indexOf('--' + name) >= 0;
}

// liveReloader
function gulpLiveReloader(port) {
	const wss = new WebSocketServer({ port });

	let wsClient;
	let wsClients = [];
	wss.on('connection', (ws) => {
		wsClient = ws;
		broadcastWSMessage({message: 'WS Connected'})
	});

	const broadcastWSMessage = (message) => {
		let jsonMessage = JSON.stringify(message);

		wss.clients?.forEach((client, i) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(jsonMessage);
			}
		});
	}

	const closeWS = (message) => {
		wss.clients?.forEach((client, i) => {
			if (client.readyState === WebSocket.OPEN) {
				client.terminate();
			}
		});
	}

	return { broadcastWSMessage, closeWS };
}

function writeFileMiddleware(request, respond, next) {
	// Write POST data to file

	const
		body     = '',
		filePath = __dirname + '\\src\\data\\data.json';

	request.on('data', function(data) {
		body += data;
	});

	request.on('end', function (){
		fs.writeFile(filePath, body, function() {
			respond.end(body);
		});
	});
}

const getFreePort = (testPort) => {
	const checkPort = (port, resolve) => {
		const srv = net.createServer();
		srv.listen(port, () => {
			const freePort = srv.address().port
			srv.close();
			resolve(freePort);
		});

		srv.on('error', (e) => {
			if (e.code === 'EADDRINUSE') {
				console.log(`Port ${port} in use, retrying...`);
				setTimeout(() => {
					srv.close();
					checkPort(port + 1, resolve);
				}, 500);
			}
		});
	}

	return new Promise((resolve) => {
		return checkPort(testPort, resolve);
	});
}

export { throttle, checkParam, gulpLiveReloader, getFreePort };