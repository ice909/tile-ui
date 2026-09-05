# Optional Preview Variants

Each framework's existing demo registry entry keeps `title`, `description`, and `Component`. It may additionally declare:

```ts
variants?: readonly {
  id: string;
  title: string;
  Component: FrameworkComponent;
}[];
```

- Omit `variants` (or use an empty array) to keep the existing single preview.
- Array order determines tab order; the first variant is initially selected.
- IDs must be unique within the entry and match source filenames.
- Store each actual render component in `components/demos/<slug>/<id>.tsx`.
- Import that component as the variant's `Component`; do not put docs wrappers in it.
- Source generation discovers these subdirectory files without creating top-level registry items. React and Solid look up `<slug>/<id>`; Vue's document payload supplies `variantCode[id]`.
- The document-level selector mounts only the selected standard preview and its render component. Switching variants resets that preview's expansion and demo state, and unmounts inactive effects.

React uses `ComponentPreview`, Vue uses `DocPreview`, and Solid uses `ComponentPreview` for both ordinary and variant previews. Variant metadata never changes the preview shell or adds preview/code tabs.
