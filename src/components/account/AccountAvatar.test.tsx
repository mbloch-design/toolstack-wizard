import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import AccountAvatar from './AccountAvatar';
afterEach(cleanup);
it('renders a bounded decorative no-referrer image and initial on failure',()=>{
 const view=render(<AccountAvatar ownerId="A" label="Alice" avatarUrl="https://avatars.githubusercontent.com/u/1"/>);
 const img=view.container.querySelector('img')!;expect(img).toHaveAttribute('alt','');expect(img).toHaveAttribute('referrerpolicy','no-referrer');expect(img).toHaveAttribute('width','32');expect(img).toHaveAttribute('height','32');
 fireEvent.error(img);expect(view.container.querySelector('img')).toBeNull();expect(view.container).toHaveTextContent('A');
});
it('resets the failed image for a different owner and hides old pixels immediately',()=>{
 const view=render(<AccountAvatar ownerId="A" label="Alice" avatarUrl="https://avatars.githubusercontent.com/u/1"/>);fireEvent.error(view.container.querySelector('img')!);
 view.rerender(<AccountAvatar ownerId="B" label="Bob" avatarUrl="https://avatars.githubusercontent.com/u/2" large/>);
 expect(view.container.querySelector('img')).toHaveAttribute('src','https://avatars.githubusercontent.com/u/2');expect(view.container.querySelector('img')).toHaveAttribute('width','56');
 view.rerender(<AccountAvatar ownerId="B" label="Bob" avatarUrl={null}/>);expect(view.container.querySelector('img')).toBeNull();expect(view.container).toHaveTextContent('B');
});
