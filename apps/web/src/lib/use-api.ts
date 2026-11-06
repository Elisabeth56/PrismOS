'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from './api'

interface State<T> {
  data: T | undefined
  error: ApiError | undefined
  loading: boolean
}

const asApiError = (error: unknown) =>
  error instanceof ApiError ? error : new ApiError(0, 'unknown', 'Something went wrong. Try again.')

/** Loads on mount and whenever `key` changes. `reload` refetches without blanking what's shown. */
export function useApi<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<State<T>>({ data: undefined, error: undefined, loading: true })
  // the latest loader, so callers can pass an inline function without refetching every render
  const loader = useRef(load)
  useEffect(() => {
    loader.current = load
  })

  const reload = useCallback(async () => {
    try {
      setState({ data: await loader.current(), error: undefined, loading: false })
    } catch (error) {
      setState((current) => ({ ...current, error: asApiError(error), loading: false }))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    loader
      .current()
      .then((data) => !cancelled && setState({ data, error: undefined, loading: false }))
      .catch((error) => !cancelled && setState({ data: undefined, error: asApiError(error), loading: false }))
    return () => {
      cancelled = true
    }
  }, [key])

  const setData = useCallback((data: T) => setState({ data, error: undefined, loading: false }), [])
  return { ...state, reload, setData }
}
