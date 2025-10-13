import { useState, useCallback } from 'react'

interface UseLoadingReturn {
  loading: boolean
  setLoading: (loading: boolean) => void
  withLoading: <T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R>
  startLoading: () => void
  stopLoading: () => void
}

export function useLoading(initialState: boolean = false): UseLoadingReturn {
  const [loading, setLoading] = useState(initialState)

  const startLoading = useCallback(() => setLoading(true), [])
  const stopLoading = useCallback(() => setLoading(false), [])

  const withLoading = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        setLoading(true)
        return await fn(...args)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  return {
    loading,
    setLoading,
    withLoading,
    startLoading,
    stopLoading
  }
}
