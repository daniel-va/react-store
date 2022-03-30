/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import {
  addStoreListener,
  getStoreInternals,
  removeStoreListener,
} from '../createStore'
import { Store } from '../Store'

/**
 * Hooks that runs and observes a stores actions.
 *
 * Note that only read-only actions are supported.
 * Updates will cause an error.
 *
 * @param store The store to run actions on.
 *
 * @returns The actions of `store`.
 *          Running an action will cause the component to rerender whenever
 *          the state updates, and when the actions arguments change.
 */
export const useStore = <STORE extends Store<any>>(store: STORE): HookActions<STORE> => {
  const internals = getStoreInternals(store)
  // if (hookActionsKey in internals) {
  //   return internals[hookActionsKey]
  // }

  const actions = {} as HookActions<STORE>
  for (const key of Object.keys(store)) {
    if (typeof key !== 'string') {
      // Skip the private key and other potential symbol keys
      continue
    }
    const runAction = (input: unknown[]): unknown => {
      const { update } = internals
      internals.update = throwUpdateError
      const result = store[key](...input)
      internals.update = update
      return result
    }

    (actions as any)[key as keyof STORE] = function useAction(...input: unknown[]): unknown {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [result, setResult] = useState(() => [runAction(input)])

      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        const listener = () => {
          setResult([runAction(input)])
        }
        addStoreListener(store, listener)
        return () => removeStoreListener(store, listener)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [...input])

      return result[0]
    }
  }
  internals[hookActionsKey] = actions
  return actions
}

type HookActions<STORE extends Store<any>> = {
  [K in keyof STORE]: STORE[K]
}

const hookActionsKey = Symbol('store/hookActions')

const throwUpdateError = () => {
  throw new Error('can\'t run store updates in a hook')
}
