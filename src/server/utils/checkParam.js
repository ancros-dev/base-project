export default function checkParam(params, name) {
	return params.indexOf('--' + name) >= 0;
}