import https from 'https';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import checkParam from './utils/checkParam.js';
import Router from './Router.js';
dotenv.config();

const __dirname = path.resolve();

class Server {
	constructor(options) {
		this.options = options;
		this.express = express;
		this.app = express();

		// Render
		const noCache = true;

		this.env = nunjucks.configure(this.options.templates, {
			autoescape: false,
			noCache,
			express: this.app
		});

		this.app.engine('njk', this.env.render);
		this.app.set('view engine', 'njk');

		this.setupStaticFiles(this.app, this.options.staticDir);
		this.app.use(cookieParser());
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.text({limit: '1mb'}));

		// Router
		this.app.use('/', new Router(express.Router(), this).router);

		// TODO: Централизованная обработка ошибок
		/*this.app.error(function(err, req, res, next){
			console.log('ERROR HANDLER');
			if (err instanceof NotFound) {
				res.render('404.jade', { locals: {
						  title : '404 - Not Found'
						 ,description: ''
						 ,author: ''
						 ,analyticssiteid: 'XXXXXXX'
						},status: 404 });
			} else {
				res.render('500.jade', { locals: {
						  title : 'The Server Encountered an Error'
						 ,description: ''
						 ,author: ''
						 ,analyticssiteid: 'XXXXXXX'
						 ,error: err
						},status: 500 });
			}
		});*/

		/*
		*/

		/*this.app.use(function(err: any, req: any, res: any, next: any) {
			console.error(err.stack);
			res.status(500).render('errorPage.njk', {
				serverData: {
					devMode,
					version: +new Date(),
					source: 'node',
					error: {
						message: devMode ? err.stack : 'Something went wrong',
						status: 500
					}
				}
			});
		});*/

		this.attachServer(this.options.port);
	}

	setupStaticFiles = (app, staticDir) => {
		const staticList = this.readAllStaticFolders(staticDir);
		
		Object.keys(staticList).map((key) => {
			const value = staticList[key];
			app.use(key, express.static(path.join(staticDir, value)));
		});
	}

	readAllStaticFolders = (staticDir) => {
		const staticFoldersList = fs.readdirSync(staticDir, { withFileTypes: true });
		const staticFolders = {};

		staticFoldersList.forEach((item) => {
			if (item.isDirectory()) {
				const name = '/' + item.name;
				staticFolders[name] = name;
			}
		});

		const staticList = {
			...staticFolders,
			...this.options.additionalStaticItems
		};

		return staticList;
	}

	attachServer = (port) => {
		let server;

		if (process.env.HTTPSKEY && process.env.HTTPSCRT) {
			const key  = fs.readFileSync(path.resolve(__dirname,  process.env.HTTPSKEY || '')).toString();
			const cert = fs.readFileSync(path.resolve(__dirname, process.env.HTTPSCRT || '')).toString();

			server = https.createServer({
			  key:  key,
			  cert: cert,
			}, this.app);

			this.httpsMode = true;
		} else {
			server = this.app;
		}

		server.listen(port, () => {
			if (this.options.devMode) {
				const dataSource = this.options.staticOnly ? 'Gulp' : 'Express';
				const projectName = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')).name;

				console.log('-----------------------------------');
				console.log(` Project name      : ${projectName}`);
				console.log(` Server listening  : http${this.httpsMode ? 's' : ''}://localhost:%d`, port);
				console.log(` Live reloader port: ${process.env.WSPORT}`);
				console.log(` Data source       : ${dataSource}`);
				console.log('-----------------------------------');
				
				process && process.send && process.send({ "message": "ready" });

				process.on('message', (message) => {
					if (message) {
						console.log('message from gulp', message);
					}
				});
			} else {
				console.log('Server listening  : localhost:%d', port);
			}
		});
	}
}

new Server({
	port: (process.env.PORT && +process.env.PORT) || 3000,
	devMode: process.env.NODE_ENV === 'development',
	templates: path.resolve(__dirname, 'build/views'),
	staticOnly: checkParam(process.argv, 'static'),
	staticDir: path.resolve(__dirname, 'build/client'),
	additionalStaticItems: {
		'/favicon.ico': '/favicons/favicon.ico',
		'/robots.txt': 	'/robots.txt',
		'/data/': '../data/'
	},
	devData: JSON.parse(fs.readFileSync(path.resolve('build/data/', 'data.json'), 'utf8').replace(/\'/, '&#39;'))
});


export { Server };
