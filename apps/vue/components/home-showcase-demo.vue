<script setup lang="ts">
import { ref } from 'vue';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@tile-ui/vue';
// @showcase-stage-1-start
import { Switch } from '@tile-ui/vue';
// @showcase-stage-1-end
// @showcase-stage-2-start
import { Progress } from '@tile-ui/vue';
// @showcase-stage-2-end

type ShowcasePhase = 'idle' | 'adding' | 'removing';

const { stage, phase } = defineProps<{ stage: number; phase: ShowcasePhase }>();
const project = ref('vue-studio');
// @showcase-stage-1-start
const preview = ref(true);
// @showcase-stage-1-end
// @showcase-stage-2-start
const progress = ref(68);
// @showcase-stage-2-end
</script>

<template>
	<Card class="framework-showcase-card">
		<CardHeader>
			<div class="framework-showcase-card__title">
				<div>
					<CardTitle>Ship a Vue workspace</CardTitle>
					<CardDescription class="framework-showcase-card__description">Configure your next registry-powered release.</CardDescription>
				</div>
				<Badge variant="secondary">Ready</Badge>
			</div>
		</CardHeader>
		<CardContent class="framework-showcase-card__content">
			<Input :model-value="project" label="Project name" :helper-text="`tile.dev/${project || 'workspace'}`" @update:model-value="project = $event" />
			<!-- @showcase-stage-1-start -->
			<div class="framework-showcase-card__row framework-showcase-card__stage" :data-visible="stage >= 1" :data-active="stage === 1 ? phase : 'idle'">
				<div><strong>Preview deployments</strong><span>Build every branch with Nuxt.</span></div>
				<Switch :model-value="preview" aria-label="Enable preview deployments" @update:model-value="preview = $event" />
			</div>
			<!-- @showcase-stage-1-end -->
			<!-- @showcase-stage-2-start -->
			<div class="framework-showcase-card__progress framework-showcase-card__stage" :data-visible="stage >= 2" :data-active="stage === 2 ? phase : 'idle'">
				<div>
					<strong>Registry sync</strong><span>{{ progress }}%</span>
				</div>
				<Progress :value="progress" aria-label="Registry sync progress" />
			</div>
			<!-- @showcase-stage-2-end -->
		</CardContent>
		<CardFooter class="framework-showcase-card__footer">
			<!-- @showcase-stage-3-start -->
			<Button class="framework-showcase-card__stage" :data-visible="stage >= 3" :data-active="stage === 3 ? phase : 'idle'" variant="outline" @click="progress = 0"
				>Reset</Button
			>
			<!-- @showcase-stage-3-end -->
			<Button>Deploy workspace</Button>
		</CardFooter>
	</Card>
</template>
