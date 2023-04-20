export default function getQuery() {
	const 
		params = window.location.search.slice(1);
	
	if (!params) {
		return {};
	}
	
	const 
		result = params.split('&').map(function(i) { return i.split('=');}).reduce(function(m,o){ m[o[0]] = o[1]; return m;},{});
	
	return result;
}

/*export default function getQuery(name) {
	let params = new URLSearchParams(location.search.slice(1));
	
	return params.get(name);
}*/