import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ onNavigate: vi.fn() }));

const { transitionKind } = await import('./view-transitions.js');

describe('transitionKind', () => {
	it('crossfades between the tab destinations', () => {
		expect(transitionKind('/', '/plants')).toBe('fade');
		expect(transitionKind('/settings', '/')).toBe('fade');
		expect(transitionKind('/plants/', '/settings')).toBe('fade');
	});

	it('slides forward going deeper, back coming up', () => {
		expect(transitionKind('/plants', '/plants/pilea')).toBe('forward');
		expect(transitionKind('/', '/plants/pilea')).toBe('forward');
		expect(transitionKind('/plants/pilea', '/plants/pilea/edit')).toBe('forward');
		expect(transitionKind('/plants/pilea/log/new', '/plants/pilea')).toBe('back');
		expect(transitionKind('/plants/pilea', '/plants')).toBe('back');
		expect(transitionKind('/plants/pilea', '/')).toBe('back');
	});

	it('leaves the Add flow upwards onto the new plant', () => {
		expect(transitionKind('/plants/new/pilea', '/plants/abc')).toBe('back');
	});

	it('crossfades list and plant on a wide screen, where the list stays', () => {
		expect(transitionKind('/plants', '/plants/pilea', true)).toBe('fade');
		expect(transitionKind('/plants/pilea', '/plants', true)).toBe('fade');
		expect(transitionKind('/plants', '/plants/new', true)).toBe('forward');
		expect(transitionKind('/plants/pilea', '/plants/pilea/edit', true)).toBe('forward');
	});

	it('does nothing when only the query changes', () => {
		expect(transitionKind('/plants/pilea', '/plants/pilea')).toBeNull();
	});
});
