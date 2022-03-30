/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */

import { useContext, useMemo } from 'react'
import StoreContext from '../components/StoreContext'
import { Store, Stores } from '../index'
import { Actions, ActionsOf, isStore } from '../Store'

export function useStore(): { [K in keyof Stores]: ActionsOf<Stores[K]> }
export function useStore<STORE extends Store<any, any>>(store: STORE): ActionsOf<STORE>
export function useStore<ACTIONS extends Actions>(actions: ACTIONS): ACTIONS
export function useStore<STORE extends Store<any, any>>(store?: STORE | ActionsOf<STORE>): unknown {
  const context = useContext(StoreContext)
  return useMemo(() => {
    if (context === null) {
      throw new Error('store context has not been initialized correctly')
    }
    if (store === undefined) {
      return context.actions
    }
    if (isStore(store)) {
      const internals = context.storeMapping.get(store)
      if (internals === undefined) {
        throw new Error('store is not registered')
      }
      return internals.hooks
    }
    const internals = context.actionMapping.get(store as ActionsOf<STORE>)
    if (internals === undefined) {
      throw new Error('store is not registered')
    }
    return internals.hooks
  }, [context, store])
}
