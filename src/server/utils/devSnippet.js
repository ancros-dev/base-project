// @ts-nocheck


const liveReloader = () => {
	if (window.self !== window.top) {
		return;
	}
	
	const ignoreCSSLinks = ['fonts.googleapis.com'];
	const config = {
		//@ts-ignore
		colors: {
			injectCSS: '#8bc34a',
			reloadImages: '#8bc34a',
			connected: '#2196f3',

		},
		port: window.liveReloaderWSPort,
		reconnectAttempts: 1000,
		messageTitle: 'Live reloader: '
	};
	
	let reconnectCount = 0;
	let reconnectionInProgress = false;

	const clearUrl = (url) => {
		const u = new URL(url);

		return {
			clearLink: u.origin + u.pathname,
			params: u.searchParams
		}
	}

	const injectCSS = () => {
		console.log(config.messageTitle + '%cInject CSS', `color: ${config.colors.injectCSS}`);

		const links = Array.from(document.querySelectorAll('link')).filter((item, i, arr) => {
			if (item.rel === 'stylesheet') {
				return item;
			}
		});

		links.forEach((item) => {
			const { clearLink, params } = clearUrl(item.href);
			
			if (checkLinkIgnore(clearLink)) {
				return;
			}

			params.set('v', +(new Date()))
			item.href = clearLink + `?${params}`;
		});
	};

	const checkLinkIgnore = (link) => {
		return ignoreCSSLinks.filter((ignoredLink) => {
			if (link.indexOf(ignoredLink) > -1) {
				return true;
			}
		}).length;
	}

	const reloadImages = () => {
		console.log(config.messageTitle + '%cReload images', `color: ${config.colors.reloadImages}`);

		const images = document.querySelectorAll('img');

		images.forEach((item) => {
			const date = new Date().valueOf();
			item.src = item.src + `?v=${date}`
		});
	}

	const reload = () => {
		location.reload();
	};

	const connect = () => {
		reconnectCount++;
		
		if (reconnectCount > config.reconnectAttempts) {
			console.log(config.messageTitle + 'Unable to reconnect');
			console.log(config.messageTitle + 'Looks like Gulp is out of service');
			return;
		}

		const ws = new WebSocket('ws://localhost:' + config.port);

		ws.addEventListener('open', () => {
			console.log(config.messageTitle + '%cConnected', `color: ${config.colors.connected}`);
			reconnectionInProgress = false;
		});

		ws.addEventListener('close', (event) => {
			if (event.wasClean) {
				console.log(config.messageTitle + '%cClean exit', 'color: #2196f3;');
			} else {
				if (!reconnectionInProgress) {
					console.log(config.messageTitle + 'Connection lost. Trying to reconnect');
				}

				reconnectionInProgress = true;
				socket = connect();
			}
		});

		ws.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);
			
			if (data.message) {
				switch (data.message) {
					case 'reload':
						reload();
						break;
				
					case 'injectCSS':
						injectCSS();
						break;

					case 'reloadImages':
						reloadImages();
						break;
				}
			}
		});

		/*ws.addEventListener('error', (error) => {
			console.log('Error', error);
		});*/
		
		return ws;
	};

	let socket = connect();
};

const snippet = (wsPort) => {
	return `<script>
		window.liveReloaderWSPort = ${wsPort};
		(${liveReloader})();
	</script>`;
}

export default snippet;