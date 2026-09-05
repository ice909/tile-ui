# Liveline Adapter Contract

Compared with upstream `../liveline/src/Liveline.tsx` and `LivelineTransition.tsx`.

## Layout

Upstream returns value, controls, and chart as siblings. Its `className` and `style` affect only the chart, whose default height is 100%. Consequently a 100%-height chart plus controls exceeds a fixed-height parent.

Tile intentionally keeps a single ref/attribute root and its three-row grid: `style` and the root class size the **complete widget**. The chart consumes the remaining height by default. This preserves containment when controls or the value display are enabled, including inside transition layers.

All adapters expose `surfaceStyle` and `surfaceClassName` for upstream-style chart-only customization. For example, `surfaceStyle={{ height: '240px' }}` sets the engine's measured chart height, not the combined widget height. An explicit surface height may exceed a smaller root; this is intentional, not silently clamped. Prefer a root height for contained dashboards, or an auto-height root when setting chart-only height. Styles are not duplicated across root and surface (which would double padding/borders and backgrounds).

The surface does not impose overflow clipping: the engine's DOM badge and tooltip can extend beyond it, as upstream allows. Consumers may explicitly request clipping via surfaceStyle. Control-row horizontal scrolling remains to keep narrow widgets usable. Fonts and control metrics follow upstream; canvas/badge font choices remain owned by the core engine.

## Interaction And Lifecycle

Retained series controls preserve fade-out layout, but have aria-hidden and disabled buttons while inactive. React toggle notifications occur in the event handler, never in replayable state updaters. At least one series remains visible. React transition inert uses a nonempty attribute value, supporting React 18's unknown-attribute handling and React 19's boolean handling.

React retains keyed elements; Vue recursively unwraps Fragment children so template v-for slots retain their actual chart keys. Interrupted fades settle to only the latest active key, and reduced motion switches immediately.

Solid uses a lazy keyed factory, not eager JSX children or a separate keys list. JSX must be created inside the factory, not precreated in a map:

```tsx
<LivelineTransition active={mode()}>{(key) => <Liveline data={data()} value={value()} mode={key === 'candle' ? 'candle' : 'line'} />}</LivelineTransition>
```

The factory runs under a keyed For layer owner. Removing that layer disposes the actual chart engine, observers, and animation loop. Stable string keys prevent unrelated signal updates from recreating retained engines. SSR uses the same factory and needs neither DOM attributes nor a parallel key list. This replaces an unshipped API; there is no eager-children compatibility path. Solid demos/docs/registry consumers outside this component scope must migrate to the factory API before publication.
