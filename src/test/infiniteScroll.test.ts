import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock supabase client BEFORE importing the hook
const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: any[]) => invokeMock(...args) } },
}));

import { useSectionFeed } from "@/hooks/useSectionFeed";

// Helper: return a unique batch per call so dedupe doesn't shrink things to zero
function makeBatch(page: number, size = 5) {
  return Array.from({ length: size }, (_, i) => ({
    id: page * 1000 + i,
    title: `Movie p${page}-${i}`,
  }));
}

beforeEach(() => {
  invokeMock.mockReset();
  invokeMock.mockImplementation(async ({ }: any, opts?: any) => {
    // not used – we use the second-arg shape below
    return { data: { items: [] }, error: null };
  });
});

describe("infinite scroll regression — pages 501+", () => {
  it("keeps hasMore=true and continues paginating well past page 500", async () => {
    // Always return a non-empty batch so the backend's page-wrap rotation is simulated
    invokeMock.mockImplementation(async (_name: string, payload: any) => {
      const page = payload?.body?.page ?? 1;
      return { data: { items: makeBatch(page), hasMore: true }, error: null };
    });

    const { result } = renderHook(() => useSectionFeed("daily"));

    // Initial auto-load fires page 1
    await waitFor(() => expect(result.current.items.length).toBeGreaterThan(0));
    expect(result.current.hasMore).toBe(true);

    // Drive loadMore() many times to cross the historical 500-page cliff
    for (let i = 0; i < 520; i++) {
      await act(async () => { await result.current.loadMore(); });
    }

    // After ~521 total pages we must still be allowed to load more
    expect(result.current.hasMore).toBe(true);
    expect(invokeMock).toHaveBeenCalled();

    // The last invocation should have been a page > 500 (proves we didn't stop)
    const lastCall = invokeMock.mock.calls.at(-1)!;
    const lastPage = lastCall[1]?.body?.page;
    expect(lastPage).toBeGreaterThan(500);

    // Items kept accumulating (no premature stop)
    expect(result.current.items.length).toBeGreaterThan(500);
  });

  it("does not stop when backend omits hasMore but still returns items", async () => {
    invokeMock.mockImplementation(async (_name: string, payload: any) => {
      const page = payload?.body?.page ?? 1;
      // Omit hasMore intentionally; hook should infer from items + page cap
      return { data: { items: makeBatch(page) }, error: null };
    });

    const { result } = renderHook(() => useSectionFeed("upcoming"));
    await waitFor(() => expect(result.current.items.length).toBeGreaterThan(0));

    for (let i = 0; i < 10; i++) {
      await act(async () => { await result.current.loadMore(); });
    }
    expect(result.current.hasMore).toBe(true);
  });
});
