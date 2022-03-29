import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  afterStoreUpdate, Id,
  Model,
  ModelStore,
  ModelStoreState,
  privateKey,
  Store,
} from './Store'

const isId = <T extends Model>(value: unknown): value is Id<T> => (
  typeof value === 'number' || typeof value === 'string'
)

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect

interface UseRecord<T extends Model> {
  (id: Id<T> | null): T | null
  (record: T): T
}

interface UseRecords<T extends Model> {
  (ids?: Id<T>[]): readonly T[]
  <O>(transform: (records: readonly T[]) => O, deps?: unknown[]): O
}

const useStore = <T>(store: Store<T>): T => {
  const inner = store[privateKey]
  const [storeState, setStoreState] = useState(inner.state)
  useStoreListener(store, setStoreState)
  return storeState
}

const createUseRecord = <T extends Model>(store: ModelStore<T>): UseRecord<T> => {
  const computeValue = (state: ModelStoreState<T>, oldValue: T | null, idOrRecord: Id<T> | T | null): T | null => {
    if (idOrRecord === null) {
      return null
    }
    if (isId(idOrRecord)) {
      return state.mapping[idOrRecord] ?? null
    }
    return state.mapping[idOrRecord.id] ?? oldValue ?? null
  }
  return (idOrRecord: Id<T> | T | null) => {
    const createForceUpdate = useCreateSingleUpdate()
    const result = useRef<T | null>()
    if (result.current === undefined) {
      if (idOrRecord !== null && !isId(idOrRecord)) {
        const record = store[privateKey].parse(idOrRecord)
        store.save(record)
        result.current = record
      } else {
        result.current = computeValue(store[privateKey].state, null, idOrRecord)
      }
    }
    useStoreListener(store, (state) => {
      const newResult = computeValue(state, result.current as T | null, idOrRecord)
      if (newResult !== result.current) {
        result.current = newResult
        afterStoreUpdate(createForceUpdate())
      }
    }, [idOrRecord])
    return result.current as T
  }
}


const createUseRecords = <T extends Model>(store: ModelStore<T>): UseRecords<T> => {
  const computeValue = <O>(state: ModelStoreState<T>, idsOrTransform?: Id<T>[] | ((records: readonly T[]) => O)): readonly T[] | O | null => {
    if (idsOrTransform === undefined) {
      return state.list
    }
    if (Array.isArray(idsOrTransform)) {
      return store.list(idsOrTransform)
    }
    return idsOrTransform(state.list)
  }
  return <O>(idsOrTransform?: Id<T>[] | ((records: readonly T[]) => O), deps: unknown[] = []) => {
    const createForceUpdate = useCreateSingleUpdate()
    const result = useRef<readonly T[] | O | null>()
    if (result.current === undefined) {
      result.current = computeValue(store[privateKey].state, idsOrTransform)
    }
    useStoreListener(store, (state) => {
      const newResult = computeValue(state, idsOrTransform)
      if (newResult !== result.current) {
        result.current = newResult
        afterStoreUpdate(createForceUpdate())
      }
    }, typeof idsOrTransform === 'function' ? deps : [idsOrTransform, ...deps])
    return result.current
  }
}

const useStoreListener = <T>(store: Store<T>, listen: (value: T) => void, deps?: unknown[]) => {
  const inner = store[privateKey]
  const callback = useRef(listen)
  callback.current = listen
  useIsomorphicLayoutEffect(() => {
    const listener = (state: T) => {
      callback.current(state)
    }
    inner.listeners.push(listener)
    return () => {
      const i = inner.listeners.indexOf(listener)
      inner.listeners.splice(i, 1)
    }
  }, [])

  // Conditional hook call - this is kind of really dangerous, but the cleanest way to solve this issue by far.
  // Keep it this way for now, and hope that no one gets the idea to swap a deps array between undefined and array.
  if (deps !== undefined) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const isFirst = useRef(true)

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsomorphicLayoutEffect(() => {
      // Skip the first call, since it always happens, and causes unnecessary rerenders.
      // `useStoreListener` does not guarantee a callback directly after initialization.
      if (isFirst.current) {
        isFirst.current = false
        return
      }
      afterStoreUpdate(() => callback.current(inner.state))
    }, deps)
  }
}

const useCreateSingleUpdate = (): () => () => void => {
  const [_, forceUpdate] = useState({})

  const renderCountRef = useRef(0)
  renderCountRef.current += 1

  const cursorRef = useRef<number | null>(null)

  const forceNextUpdate = useCallback(() => {
    if (renderCountRef.current === cursorRef.current) {
      forceUpdate({})
      cursorRef.current = null
    }
  }, [forceUpdate])

  return useCallback(() => {
    cursorRef.current = renderCountRef.current
    return forceNextUpdate
  }, [forceNextUpdate])
}

export {
  useStore,
  createUseRecord,
  createUseRecords,
}
