import fs, { Dirent } from 'fs';
import path from 'path';

class TemplateLoader {
	constructor(rootTemplatePath, noCache = false) {
		this.rootTemplatePath = rootTemplatePath;
		this.noCache = noCache;
		this.folders = this.getDirectoriesRecursive(rootTemplatePath);
	}

	flatten = (lists) => {
		return lists.reduce((a, b) => a.concat(b), []);
	}

	getDirectories = (srcpath) => {
		return fs.readdirSync(srcpath)
			.map((file) => path.join(srcpath, file))
			.filter((path) => fs.statSync(path).isDirectory());
	}

	getDirectoriesRecursive = (srcpath) => {
		return [srcpath, ...this.flatten(this.getDirectories(srcpath).map(this.getDirectoriesRecursive))];
	}

	getSource = (name) => {
	    const p = path.resolve(this.rootTemplatePath, name);
		const src = fs.readFileSync(p, 'utf8')

		return {
			src,
			path: p,
			noCache: this.noCache
		}
	}
}

export default TemplateLoader;