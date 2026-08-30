'use client';

import Link from 'next/link';
import { reactHomeLinks } from '../../common/lib/docs';
import { HomeCodeCompare } from './home-code-compare';

export function HomePage() {
	return (
		<main className="docs-shell framework-home react-home">
			<section className="framework-hero">
				<div className="framework-hero__copy">
					<p className="eyebrow">Shared system. React composition.</p>
					<h1>Build the interface. Keep the control.</h1>
					<p className="lede">Composable React components, practical hooks, and installable source for teams that want a design system without a black box.</p>
					<div className="framework-hero__actions">
						<Link href="/docs" className="framework-button framework-button--primary">
							Read the docs
						</Link>
						<Link href="/docs/components" className="framework-button">
							Browse components
						</Link>
					</div>
				</div>
				<div className="react-composition" aria-label="React composition model">
					<div className="react-composition__bar">
						<span>workspace.tsx</span>
						<small>Live tree</small>
					</div>
					<div className="react-composition__tree">
						<div className="react-node react-node--root">&lt;Workspace&gt;</div>
						<div className="react-composition__branch">
							<div className="react-node">&lt;Form&gt;</div>
							<div className="react-node">useMedia()</div>
						</div>
						<div className="react-composition__branch react-composition__branch--deep">
							<div className="react-node">&lt;Input /&gt;</div>
							<div className="react-node react-node--active">&lt;Button /&gt;</div>
						</div>
					</div>
					<p>Props flow down. Intent stays with you.</p>
				</div>
			</section>

			<section className="framework-paths" aria-label="React documentation paths">
				{reactHomeLinks.map((section) => (
					<Link key={section.href} href={section.href} className="framework-paths__item">
						<span>{String(reactHomeLinks.indexOf(section) + 1).padStart(2, '0')}</span>
						<h2>{section.title}</h2>
						<p>{section.description}</p>
						<small>→</small>
					</Link>
				))}
			</section>

			<HomeCodeCompare />

			<section className="framework-runtime" aria-labelledby="react-runtime-title">
				<div>
					<p className="eyebrow">Built for the React ecosystem</p>
					<h2 id="react-runtime-title">From local state to production rendering.</h2>
				</div>
				<ul>
					<li>
						<strong>Client + server</strong>
						<span>Designed for interactive clients and modern React server rendering.</span>
					</li>
					<li>
						<strong>Hooks included</strong>
						<span>Reusable browser behavior through a dedicated hooks entry point.</span>
					</li>
					<li>
						<strong>Source available</strong>
						<span>Install registry items directly into the application you own.</span>
					</li>
				</ul>
			</section>

			<section className="framework-family" aria-labelledby="react-family-title">
				<div className="framework-family__intro">
					<p className="eyebrow">One system, every runtime</p>
					<h2 id="react-family-title">Your framework, your components.</h2>
					<p>Tile UI carries the same design language and source-owned workflow across frameworks, without flattening their native patterns.</p>
				</div>
				<div className="framework-family__links">
					<div className="framework-family__item framework-family__item--react framework-family__current" aria-current="page">
						<span className="framework-family__icon framework-family__icon--react" aria-hidden="true">
							<svg viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="2.2" fill="currentColor" />
								<ellipse cx="12" cy="12" rx="9" ry="3.8" />
								<ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
								<ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
							</svg>
						</span>
						<span className="framework-family__name">
							<strong>React</strong>
							<small>Current site</small>
						</span>
					</div>
					<a className="framework-family__item framework-family__item--vue" href="https://vue.tileui.zmorg.cn/docs" target="_blank" rel="noreferrer">
						<span className="framework-family__icon framework-family__icon--vue" aria-hidden="true">
							<svg viewBox="0 0 24 24">
								<path d="M2 4h4.3L12 14l5.7-10H22L12 21 2 4Z" fill="currentColor" />
								<path className="framework-family__vue-inner" d="M6.7 4H10l2 3.5L14 4h3.3L12 13.3 6.7 4Z" />
							</svg>
						</span>
						<span className="framework-family__name">
							<strong>Vue</strong>
							<small>Available now</small>
						</span>
						<span className="framework-family__arrow" aria-hidden="true">
							↗
						</span>
					</a>
					<a className="framework-family__item framework-family__item--solid" href="https://solid.tileui.zmorg.cn/docs" target="_blank" rel="noreferrer">
						<span className="framework-family__icon framework-family__icon--solid" aria-hidden="true">
							<svg viewBox="0 0 24 24">
								<path d="M11.558.788A9.082 9.082 0 0 0 9.776.99l-.453.15c-.906.303-1.656.755-2.1 1.348L4.887 6.468c.426-.387.974-.698 1.643-.894l.614-.154a8.82 8.82 0 0 1 1.777-.206c2.916-.053 6.033 1.148 8.423 2.36 2.317 1.175 3.888 2.32 3.987 2.39L24 5.518c-.082-.06-1.66-1.21-3.991-2.386C17.616 1.926 14.488.736 11.558.788ZM8.924 5.366a8.634 8.634 0 0 0-1.745.203l-.606.151c-1.278.376-2.095 1.16-2.43 2.108-.334.948-.188 2.065.487 3.116.33.43.747.813 1.216 1.147L12.328 10a6.943 6.943 0 0 1 6.013 1.013l2.844-.963c-.17-.124-1.663-1.2-3.91-2.34-2.379-1.206-5.479-2.396-8.352-2.344Zm5.435 4.497a6.791 6.791 0 0 0-1.984.283L2.94 13.189 0 18.334l9.276-2.992a6.945 6.945 0 0 1 7.408 2.314c.695.903.89 1.906.66 2.808l2.572-4.63c.595-1.041.45-2.225-.302-3.429a6.792 6.792 0 0 0-5.255-2.543Zm-3.031 5.341a6.787 6.787 0 0 0-2.006.283L.008 18.492c.175.131 2.02 1.498 4.687 2.768 2.797 1.332 6.37 2.467 9.468 1.712l.454-.152c1.278-.376 2.134-1.162 2.487-2.09.353-.93.207-2.004-.541-2.978a6.791 6.791 0 0 0-5.237-2.548Z" />
							</svg>
						</span>
						<span className="framework-family__name">
							<strong>Solid</strong>
							<small>Available now</small>
						</span>
						<span className="framework-family__arrow" aria-hidden="true">
							↗
						</span>
					</a>
					<div className="framework-family__item framework-family__more">
						<span className="framework-family__icon">+</span>
						<span className="framework-family__name">
							<strong>More frameworks</strong>
							<small>On the horizon</small>
						</span>
					</div>
				</div>
			</section>
		</main>
	);
}
