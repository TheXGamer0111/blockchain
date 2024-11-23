import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

export function useDataPolling(action, interval = 30000) {
  const dispatch = useDispatch()
  const timeoutRef = useRef(null)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        if (!isMounted || !isPolling) return
        await dispatch(action())
        timeoutRef.current = setTimeout(fetchData, interval)
      } catch (error) {
        console.error('Polling error:', error)
        timeoutRef.current = setTimeout(fetchData, interval * 2)
      }
    }

    fetchData()

    return () => {
      isMounted = false
      setIsPolling(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [dispatch, action, interval, isPolling])

  return {
    stopPolling: () => setIsPolling(false),
    startPolling: () => setIsPolling(true)
  }
} 