import { createHandler, StartServer, type DocumentComponentProps, type StartHandler } from '@solidjs/start/server';
import { setResponseHeader } from '@solidjs/start/http';

function Document(props: DocumentComponentProps) {
	return (
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{props.assets}
			</head>
			<body>
				<div id="app">{props.children}</div>
				{props.scripts}
			</body>
		</html>
	);
}

const handler: StartHandler = createHandler(() => {
	setResponseHeader('X-Tile-UI-App', 'solidstart');
	return <StartServer document={Document} />;
});

export default handler;
