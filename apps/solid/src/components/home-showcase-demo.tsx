import { createSignal } from 'solid-js';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@tile-ui/solid';
// @showcase-stage-1-start
import { Switch } from '@tile-ui/solid';
// @showcase-stage-1-end
// @showcase-stage-2-start
import { Progress } from '@tile-ui/solid';
// @showcase-stage-2-end

export function HomeShowcaseDemo(props: { stage: number; phase: 'idle' | 'locating' | 'preparing' | 'adding' | 'removing' }) {
	const [project, setProject] = createSignal('signal-studio');
	// @showcase-stage-1-start
	const [preview, setPreview] = createSignal(true);
	// @showcase-stage-1-end
	// @showcase-stage-2-start
	const [progress, setProgress] = createSignal(68);
	// @showcase-stage-2-end

	return (
		<Card class="home-showcase-card" data-edit-phase={props.phase} data-edit-stage={props.stage}>
			<CardHeader class="home-showcase-card__header">
				<div class="home-showcase-card__title">
					<div>
						<CardTitle>Ship a Solid workspace</CardTitle>
						<CardDescription class="home-showcase-card__description">Configure the next registry-powered release.</CardDescription>
					</div>
					<Badge variant="secondary">Ready</Badge>
				</div>
			</CardHeader>
			<CardContent class="home-showcase-card__content">
				<Input label="Project name" value={project()} onChangeValue={setProject} helperText={`tile.dev/${project() || 'workspace'}`} />
				{/* @showcase-stage-1-start */}
				<div
					class="home-showcase-card__row home-showcase-card__stage"
					data-stage="1"
					data-visible={props.stage >= 1}
					data-active={props.stage === 1 ? props.phase : 'idle'}>
					<div>
						<strong>Preview deployments</strong>
						<span>Build every branch with SolidStart.</span>
					</div>
					<Switch checked={preview()} onCheckedChange={setPreview} aria-label="Enable preview deployments" />
				</div>
				{/* @showcase-stage-1-end */}
				{/* @showcase-stage-2-start */}
				<div
					class="home-showcase-card__progress home-showcase-card__stage"
					data-stage="2"
					data-visible={props.stage >= 2}
					data-active={props.stage === 2 ? props.phase : 'idle'}>
					<div>
						<strong>Registry sync</strong>
						<span>{progress()}%</span>
					</div>
					<Progress value={progress()} aria-label="Registry sync progress" />
				</div>
				{/* @showcase-stage-2-end */}
			</CardContent>
			<CardFooter class="home-showcase-card__footer">
				{/* @showcase-stage-3-start */}
				<Button
					class="home-showcase-card__stage"
					data-stage="3"
					data-visible={props.stage >= 3}
					data-active={props.stage === 3 ? props.phase : 'idle'}
					variant="outline"
					onClick={() => setProgress(0)}>
					Reset
				</Button>
				{/* @showcase-stage-3-end */}
				<Button onClick={() => setProject((value) => value || 'signal-studio')}>Deploy workspace</Button>
			</CardFooter>
		</Card>
	);
}
