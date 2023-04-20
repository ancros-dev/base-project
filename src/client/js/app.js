export default class App {
	constructor() {
		console.log('app code starts here')
	}
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('app.js dom ready');
	new App();
});
