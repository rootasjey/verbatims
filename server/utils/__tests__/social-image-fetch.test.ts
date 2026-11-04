import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensureRemoteImageReady } from '../social-image-fetch'

describe('ensureRemoteImageReady', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retries a temporary non-image response before accepting the image', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        siteUrl: 'https://verbatims.cc',
        authUrl: ''
      }
    }))
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('image renderer warming up', {
        headers: { 'content-type': 'text/plain' }
      }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), {
        headers: { 'content-type': 'image/jpeg' }
      }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(ensureRemoteImageReady('https://verbatims.cc/api/social/images/quotes/27.jpg', 'Threads'))
      .resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('falls back to the public image URL when the internal request fails', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        siteUrl: 'https://verbatims.cc',
        authUrl: ''
      }
    }))
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('internal render unavailable', {
        status: 503,
        headers: { 'content-type': 'text/plain' }
      }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), {
        headers: { 'content-type': 'image/jpeg' }
      }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(ensureRemoteImageReady('https://verbatims.cc/api/social/images/quotes/27.jpg', 'Threads'))
      .resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reports the HTTP status and response body when the image endpoint keeps failing', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        siteUrl: 'https://verbatims.cc',
        authUrl: ''
      }
    }))
    const fetchMock = vi.fn().mockImplementation(() => new Response('render unavailable', {
      status: 503,
      headers: { 'content-type': 'text/plain' }
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(ensureRemoteImageReady('https://verbatims.cc/api/social/images/quotes/27.jpg', 'Threads'))
      .rejects.toThrow('Failed to fetch image from https://verbatims.cc/api/social/images/quotes/27.jpg (503: render unavailable; internal request: 503: render unavailable)')

    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})
