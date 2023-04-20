export default function fatalErrorTemplate(name, stack = '') {
	const template = `
		<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="utf-8">
					<title>Error</title>
					<style>
						body {
							font-family: Arial, sans-serif;
							color: #fff;
							background-color: #3f51b5;
							padding: 30px;
							line-height: 1.4;
						}

						h1 {
							font-size: 32px;
							font-weight: normal;
						}

						pre {
							font-size: 16px;
						}
					</style>
				</head>
				<body>
					<div>
						<h1>${name}</h1>
						<pre>${stack}</pre>
					</div>
				</body>
			</html>
	`;

	return template;
}