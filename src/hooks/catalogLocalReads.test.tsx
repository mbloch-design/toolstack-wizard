import { cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ToolBundleSection from '@/components/tool/ToolBundleSection';
import type { ToolSummary } from './useSupabaseData';
import type { Tool } from '@/data/types';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCategories, useToolSummaries, useToolBySlug, useToolPair, usePosts, usePostBySlug, getToolShardKey } from './useSupabaseData';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn(), schema: vi.fn() } }));
const wrapper = ({children}: {children: ReactNode}) => <MemoryRouter initialEntries={['/fr/tools']}>{children}</MemoryRouter>;
beforeEach(() => {
  vi.stubEnv('VITE_CATALOG_READ_SOURCE', 'local');
  const result = {data: null, error: null};
  const query = {select: vi.fn(), eq: vi.fn(), in: () => Promise.resolve(result), limit: () => Promise.resolve(result), order: () => Promise.resolve(result), maybeSingle: () => Promise.resolve(result), then: (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)};
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  vi.mocked(supabase.from).mockReturnValue(query as never);
  vi.mocked(supabase.schema).mockReturnValue({from: supabase.from} as never);
});
afterEach(() => {cleanup();vi.unstubAllEnvs();vi.unstubAllGlobals();vi.clearAllMocks();});

it('serves categories and searchable summaries locally without a remote refresh or loading spinner', async () => {
  const {result} = renderHook(() => ({categories: useCategories(), summaries: useToolSummaries()}), {wrapper});
  await waitFor(() => expect(result.current.categories.loading || result.current.summaries.loading).toBe(false));
  expect(result.current.categories.categories.length).toBeGreaterThan(0);
  expect(result.current.summaries.tools.some(t => t.slug === 'notion')).toBe(true);
  expect(supabase.from).not.toHaveBeenCalled();
});

it('resolves a client-side fiche from its shard without consulting remote projections', async () => {
  vi.stubEnv('DEV', false);
  const request = vi.fn().mockResolvedValue({ok: true, json: async () => [{id:'slack',slug:'slack',name:'Slack'}]});
  vi.stubGlobal('fetch', request);
  const {result} = renderHook(() => useToolBySlug('slack'));
  await waitFor(() => expect(result.current.tool?.slug).toBe('slack'));
  expect(request).toHaveBeenCalledWith(`/assets/tool-catalog/${getToolShardKey('slack')}.json`,{cache:'no-cache'});
  expect(supabase.from).not.toHaveBeenCalled();
  expect(supabase.schema).not.toHaveBeenCalled();
});

it('retains explicit remote opt-in for later controlled use', async () => {
  vi.stubEnv('VITE_CATALOG_READ_SOURCE','supabase');
  const {result} = renderHook(() => useCategories(),{wrapper});
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(supabase.from).toHaveBeenCalledWith('categories');
});

it('loads a local comparison and guide list without any database query', async () => {
  vi.stubEnv('DEV', false);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true,json:async()=>[{id:'slack',slug:'slack',name:'Slack'},{id:'discord',slug:'discord',name:'Discord'}]}));
  const {result} = renderHook(() => ({pair:useToolPair('slack','discord'),posts:usePosts('fr')}));
  await waitFor(() => expect(result.current.pair.toolB?.slug).toBe('discord'));
  await waitFor(() => expect(result.current.posts.posts.length).toBeGreaterThan(0));
  expect(supabase.from).not.toHaveBeenCalled();
});

it('keeps bundle members tied to the current local tool during navigation', async () => {
  const tools = [{id:'suite-a',slug:'suite-a',name:'Suite A'},{id:'member-a',slug:'member-a',name:'Member A',bundle_parent:'suite-a'},{id:'suite-b',slug:'suite-b',name:'Suite B'},{id:'member-b',slug:'member-b',name:'Member B',bundle_parent:'suite-b'}] as unknown as ToolSummary[];
  const props={tools,lang:'fr',t:(fr:string)=>fr};
  const {rerender}=render(<MemoryRouter><ToolBundleSection {...props} tool={tools[0] as Tool}/></MemoryRouter>);
  expect(screen.getByText('Member A')).toBeInTheDocument();
  rerender(<MemoryRouter><ToolBundleSection {...props} tool={tools[2] as Tool}/></MemoryRouter>);
  await waitFor(()=>expect(screen.getByText('Member B')).toBeInTheDocument());
  expect(screen.queryByText('Member A')).not.toBeInTheDocument();
  expect(supabase.from).not.toHaveBeenCalled();
});


it('resolves a guide detail locally even without a cached list', async () => {
  const { result } = renderHook(() => usePostBySlug('notion-gratuit-vs-payant-vrai-calcul', 'fr'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.post?.slug).toBe('notion-gratuit-vs-payant-vrai-calcul');
  expect(supabase.from).not.toHaveBeenCalled();
});
