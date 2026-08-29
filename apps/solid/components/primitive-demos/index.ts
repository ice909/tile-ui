import type { Component } from 'solid-js';

import PrimitivesDemo from './primitives';

export type SolidPrimitiveDemo = {
	title: string;
	description: string;
	Component: Component;
};

export const solidPrimitiveDemoRegistry: Record<string, SolidPrimitiveDemo> = {
	primitives: {
		title: 'Owner-scoped browser signals',
		description: 'All 11 package primitives demonstrate deterministic SSR, selective status feedback, and owner cleanup.',
		Component: PrimitivesDemo,
	},
};
