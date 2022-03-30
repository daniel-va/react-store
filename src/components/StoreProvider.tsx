/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from 'react'
import { Stores } from '../index'
import { Action, Actions, AnyStore, StoreInternals } from '../Store'
import StoreContext, { StoreContextState } from './StoreContext'

interface Props {
  stores: Stores
}

export const StoreProvider: React.FC<Props> = ({ stores, children }) => {
  const context: StoreContextState = useMemo(() => buildContext(stores), [stores])
  return (
    <StoreContext.Provider value={context}>
      {children}
    </StoreContext.Provider>
  )
}

interface GlobalState {
  isUpdating: boolean
  delayedNotifications: Set<StoreInternals<any>>
}

const buildContext = (stores: Stores): StoreContextState => {
  const global: GlobalState = {
    isUpdating: false,
    delayedNotifications: new Set(),
  }
  const internals: StoreContextState['internals'] = {}
  const actions: StoreContextState['actions'] = {}
  const storeMapping: StoreContextState['storeMapping'] = new Map()
  const actionMapping: StoreContextState['actionMapping'] = new Map()
  for (const key of Object.keys(stores)) {
    const store = stores[key] as AnyStore
    const internals = buildInternals(store, global)
    ;(internals as any)[key] = internals
    ;(actions as any)[key]   = internals.actions
    storeMapping.set(store, internals)
    actionMapping.set(internals.actions, internals)
  }
  return { internals, actions, storeMapping, actionMapping }
}

const buildInternals = <STORE extends AnyStore>(store: STORE, global: GlobalState): StoreInternals<STORE> => {
  const update = (apply: () => void) => runUpdate(apply, internals, global)
  const internals: StoreInternals<STORE> = {
    state: store.initialState(),
    update,
    actions: {} as Actions,
    hooks: {} as Actions,
    listeners: [],
  }
  const actions = store.actions(internals.state, (apply) => internals.update(apply))
  for (const key of Object.keys(actions)) {
    const action = actions[key]
    ;(internals.actions as any)[key] = action
    ;(internals.hooks as any)[key] = buildHook(internals, action)
  }
  return internals
}

const buildHook = <STORE extends AnyStore, ACTION extends Action<any, any>>(internals: StoreInternals<STORE>, action: ACTION): ACTION => {
  const runAction = (input: unknown[]): unknown => {
    const { update } = internals
    internals.update = throwUpdateError
    const result = action(...input)
    internals.update = update
    return result
  }

  return function useAction(...input: unknown[]): unknown {
    const [result, setResult] = useState(() => [runAction(input)])

    useEffect(() => {
      const { listeners } = internals
      const listener = () => {
        setResult([runAction(input)])
      }
      listeners.push(listener)
      return () => {
        const i = listeners.indexOf(listener)
        if (i !== -1) {
          listeners.splice(i, 1)
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...input])

    return result[0]
  } as ACTION
}

const runUpdate = <STORE extends AnyStore,>(update: () => void, internals: StoreInternals<STORE>, global: GlobalState) => {
  if (global.isUpdating) {
    update()
    return
  }
  global.isUpdating = true

  update()
  global.delayedNotifications.add(internals)
  for (const storeToNotify of global.delayedNotifications) {
    storeToNotify.listeners.forEach((listen) => {
      listen()
    })
  }
  global.delayedNotifications.clear()
  global.isUpdating = false
}

const throwUpdateError = () => {
  throw new Error('can\'t run store updates in a hook')
}
