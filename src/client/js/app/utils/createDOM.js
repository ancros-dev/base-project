export default function createDOM() {
	/*
	// hash map version
	const DOM = new Map();
	[...document.querySelectorAll(selector)].forEach((elt, i) => {
		DOM.set(elt.dataset.dom, elt);
	});
	*/

	const DOM = {};
	
	[...document.querySelectorAll('[data-elements]')].forEach((elt, i) => {
		let arr = elt.dataset.elements.split(' ');

		arr.forEach(function(item, index, array) {
			if (DOM[item]) {
				DOM[item].push(elt);
			} else {
				DOM[item] = [elt];
			}
		});
	});

	[...document.querySelectorAll('[data-element]')].forEach((elt, i) => {
		let arr = elt.dataset.element.split(' ');

		arr.forEach(function(item, index, array) {
			DOM[item] = elt;
		});
	});

	return DOM;
}
