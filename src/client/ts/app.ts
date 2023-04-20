export default class App {
	options?: string;
	// Partial<Options>
	constructor(options?: string) {
		this.options = options;
		
		this.addEvents();
		this.init();
	}
	
	addEvents = () => {
		console.log('add events');
	}
	
	init = () => {
		console.log('init');
	}
}


window.addEventListener('DOMContentLoaded', () => { new App(); })