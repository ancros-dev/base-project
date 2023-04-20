import fs from 'fs';
import express from 'express';
import path from 'path';
import fatalError from './utils/fatalError.js';

const __dirname = path.resolve();

class Router {
	constructor(router, server) {
		this.server = server;
		this.router = router;

		this.init();
		this.existingTemplates = this.getExistingTemplates(this.server.options.templates);
	}

	init = async () => {
		if (this.server.options.devMode) {
			const devSnippet = await import('./utils/devSnippet.js');
			this.render = this.initDevRender(devSnippet.default);
		} else {
			this.render = this.initRender();
		}

		// Handle errors with live reloader
		this.server.app.use((req, res, next) => {
			return res.status(404).send(this.render('errorPage', {
				serverData: {
					error: {
						status: 404,
						message: 'Not found'
					}
				}
			}));
		});

		this.createRouter();
	}

	// Get all files from top level of views folder
	getExistingTemplates = (folders) => {
		let templates = [];

		const readDir = (folder) => {
			fs.readdirSync(folder, { withFileTypes: true }).forEach((file) => {
				if (file.name.includes('.njk')) {
					templates.push(file.name);
				}
			});
		}

		if (Array.isArray(folders)) {
			folders.forEach((folder) => {
				readDir(folder);
			});
		} else {
			readDir(folders);
		}

		return templates;
	}

	createRouter = () => {
		// TODO: Dynamic asset path for different pages
		// https://stackoverflow.com/questions/11569181/serve-static-files-on-a-dynamic-route-using-express
		const staticFilesForRoute = (req, res, next) => {
			//req.url = req.params.asset; // <-- programmatically update url yourself
			//server.express.static(__dirname + '/static')(req, res, next);
		};

		const commonMiddleware = (req, res, next) => {
			const data = {
				serverData: {
					devMode: this.server.options.devMode,
					source: 'node',
					version: +new Date(),
					data: this.server.options.devData
				}
			};

			// TODO: replace 'data' with '_data'
			req.params.data = JSON.stringify(data);

			return next();
		};

		this.router.get('/', commonMiddleware, (req, res, next) => {
			return res.send(this.render('index', req.params.data));
		});

		// WARN: Только для режима разработки. Для продакшена максимально небезопасно!
		this.router.get('/:page', commonMiddleware, async (req, res, next) => {
			let page = req.params.page;

			if (page.includes('.') ) {
				page = page.split('.')[0];
			}

			const isTemplateExists = this.existingTemplates.filter((templateName) => {
				return templateName === page + '.njk';
			}).length;

			if (isTemplateExists) {
				return res.send(this.render(page, req.params.data));
			} else {
				return next();
			}
		});

		/*
		this.router.get('/api/:request', commonMiddleware, async (req, res, next) => {
			return res.send(`Handle Request ${req.params.request}`);
		});
		*/

		this.router.get('*', (req, res, next) => {
			return res.status(404).send(this.render('errorPage', {
				serverData: {
					error: {
						status: 404,
						message: 'Not found'
					}
				}
			}));
		});
	}

	initRender = () => {
		// Логика продакшен рендеринга, без дев модулей и отобржения ошибок
		return (pageName, pageData) => {
			let result;

			try {
				const data = JSON.parse(pageData);
				result = this.server.env.render(`${pageName}.njk`, data);
			} catch(e) {
				result = 'Something went wrong';
				return `${result}`;
			}

			return result;
		}
	}

	// Dev only mode. Just remove this methods and it calls
	initDevRender = (devSnippet) => {
		return (pageName, pageData) => {
			let result;
			let data = pageData;

			try {
				if (pageData && (typeof pageData === 'string')) {
					data = JSON.parse(pageData);
				}

				let page;

				if (this.server.options.staticOnly) {
					page = fs.readFileSync(path.resolve(__dirname, '../client/', `${pageName}.html`), 'utf8');
				} else {
					page = this.server.env.render(`${pageName}.njk`, data);
				}

				result = page.replace(/<\/body>/gi, `${devSnippet(process.env.WSPORT)}</body>`);
			} catch(e) {
				const page = fatalError(e.name, e.stack);
				result = page.replace(/<\/body>/gi, `${devSnippet(process.env.WSPORT)}</body>`);
				return `${result}`;
			}

			return result;
		}
	}
}


export default Router;