'use client';

import { useState } from 'react';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@tile-ui/react';
// @showcase-stage-1-start
import { Switch } from '@tile-ui/react';
// @showcase-stage-1-end
// @showcase-stage-2-start
import { Progress } from '@tile-ui/react';
// @showcase-stage-2-end

export function HomeShowcaseDemo({ stage, phase }: { stage: number; phase: 'idle' | 'adding' | 'removing' }) {
	const [project, setProject] = useState('react-studio');
	// @showcase-stage-1-start
	const [preview, setPreview] = useState(true);
	// @showcase-stage-1-end
	// @showcase-stage-2-start
	const [progress, setProgress] = useState(68);
	// @showcase-stage-2-end

	return (
		<Card className="framework-showcase-card">
			<CardHeader>
				<div className="framework-showcase-card__title">
					<div>
						<CardTitle>Ship a React workspace</CardTitle>
						<CardDescription className="framework-showcase-card__description">Configure your next registry-powered release.</CardDescription>
					</div>
					<Badge variant="secondary">Ready</Badge>
				</div>
			</CardHeader>
			<CardContent className="framework-showcase-card__content">
				<Input label="Project name" value={project} onChange={(event) => setProject(event.target.value)} helperText={`tile.dev/${project || 'workspace'}`} />
				{/* @showcase-stage-1-start */}
				<div className="framework-showcase-card__row framework-showcase-card__stage" data-visible={stage >= 1} data-active={stage === 1 ? phase : 'idle'}>
					<div>
						<strong>Preview deployments</strong>
						<span>Build every branch with React.</span>
					</div>
					<Switch checked={preview} onCheckedChange={(value) => setPreview(value === true)} aria-label="Enable preview deployments" />
				</div>
				{/* @showcase-stage-1-end */}
				{/* @showcase-stage-2-start */}
				<div className="framework-showcase-card__progress framework-showcase-card__stage" data-visible={stage >= 2} data-active={stage === 2 ? phase : 'idle'}>
					<div>
						<strong>Registry sync</strong>
						<span>{progress}%</span>
					</div>
					<Progress value={progress} aria-label="Registry sync progress" />
				</div>
				{/* @showcase-stage-2-end */}
			</CardContent>
			<CardFooter className="framework-showcase-card__footer">
				{/* @showcase-stage-3-start */}
				<Button
					className="framework-showcase-card__stage"
					data-visible={stage >= 3}
					data-active={stage === 3 ? phase : 'idle'}
					variant="outline"
					onClick={() => setProgress(0)}>
					Reset
				</Button>
				{/* @showcase-stage-3-end */}
				<Button>Deploy workspace</Button>
			</CardFooter>
		</Card>
	);
}
