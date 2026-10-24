import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import ToolGallery from './ToolGallery';
import { getToolTutorials } from '@/data/toolTutorials';

it('loads the official Kit Wistia player only after a click, never a YouTube URL', () => {
  const videos = getToolTutorials('kit');
  expect(videos).toHaveLength(1);
  const { container } = render(<ToolGallery images={[]} videos={videos} toolName="Kit" lang="en" variant="hero" />);
  expect(container.querySelector('iframe')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Play video: Official Kit introduction' }));
  expect(container.querySelector('iframe')?.getAttribute('src')).toBe('https://fast.wistia.net/embed/iframe/z0e60vz71d?autoPlay=true');
  expect(container.querySelector('iframe')?.getAttribute('title')).toBe('Official Kit introduction');
});
