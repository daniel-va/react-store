import { useEffect, useState } from 'react'
import {
  addStoreListener,
  getStoreInternals,
  removeStoreListener,
} from '../createStore'
import { Store } from '../Store'

/**
 * Hook that returns the current state of a {@link Store}.
 * The hook re-renders whenever the state is updated.
 *
 * @param store The store whose state is observed.
 */
export const useStoreState = <STATE>(store: Store<STATE>): STATE => {
  const [state, setState] = useState(() => [getStoreInternals(store).state])
  useEffect(() => {
    const listener = (state: STATE) => {
      setState([state])
    }
    addStoreListener(store, listener)
    return () => removeStoreListener(store, listener)
  }, [store])
  return state[0]
}
