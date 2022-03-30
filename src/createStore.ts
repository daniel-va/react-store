/* eslint-disable @typescript-eslint/no-explicit-any */

import { Action, StateOf, Store } from './Store'

export const createStore = <STATE, ACTIONS extends Actions<STATE>>(initialState: STATE, makeActions: MakeActions<ACTIONS>): StoreWithActions<STATE, ACTIONS> => {
  const internals: StoreInternals<STATE> = {
    state: initialState,
    listeners: [],
    update: (update) => runUpdate(update, internals),
  }

  const store = {} as StoreWithActions<STATE, ACTIONS>
  const actions = makeActions((update) => internals.update(update))
  for (const key of Object.keys(actions)) {
    store[key] = makeObservableAction(actions[key], internals) as ACTIONS[keyof ACTIONS]
  }
  (store as unknown as StoreWithInternals<STATE>)[privateKey] = internals
  return store
}

type StoreWithActions<STATE, ACTIONS extends Actions<STATE>> = {
  [K in keyof ACTIONS]: StoreAction<STATE, ACTIONS[K]>
}

type StoreAction<STATE, ACTION extends ActionWithThis<STATE, any, any>> =
  Action<STATE, ActionInputs<ACTION>, ReturnType<ACTION>>

interface Actions<STATE> {
  [x: string]: ActionWithThis<STATE, any, any>
}

interface ActionWithThis<STATE, I extends any[], O> {
  (this: STATE, ...input: I): O
}

type ActionInputs<ACTION> = ACTION extends ActionWithThis<any, infer I, any> ? I : never

interface MakeActions<ACTIONS> {
  (update: (apply: () => void) => void): ACTIONS
}

export interface StoreInternals<STATE> {
  /**
   * The current state of the store.
   * This is modified in place.
   */
  state: STATE

  /**
   * Listeners to notify whenever an update has occured.
   */
  listeners: Array<(state: STATE) => void>

  /**
   * Applies an update to the state and notifies {@link listeners}.
   * State modifications should always be run by this function.
   */
  update: ApplyUpdate
}

export interface ApplyUpdate {
  (update: Update): void
}

export interface Update {
  (): void
}

const privateKey = Symbol('store/private')

interface StoreWithInternals<STATE> {
  [privateKey]: StoreInternals<STATE>
}

export const getStoreInternals = <STORE extends Store<any>>(store: STORE): StoreInternals<StateOf<STORE>> => {
  return (store as unknown as StoreWithInternals<StateOf<STORE>>)[privateKey]
}

const makeObservableAction = <STATE, ACTION extends ActionWithThis<STATE, any, any>>(action: ACTION, internals: StoreInternals<STATE>): StoreAction<STATE, ACTION> => {
  return (...input: Parameters<ACTION>): ReturnType<ACTION> => {
    return action.apply(internals.state, input) as ReturnType<ACTION>
  }
}

export const addStoreListener = <STORE extends Store<any>>(store: STORE, listener: (state: StateOf<STORE>) => void) => {
  getStoreInternals(store).listeners.push(listener)
}

export const removeStoreListener = <STORE extends Store<any>>(store: STORE, listener: (state: StateOf<STORE>) => void) => {
  const { listeners } = getStoreInternals(store)
  const i = listeners.indexOf(listener)
  if (i !== -1) {
    listeners.splice(i, 1)
  }
}

let isUpdating = false
const storesToNotify = new Set<StoreInternals<unknown>>()

const runUpdate = <STATE>(update: Update, internals: StoreInternals<STATE>) => {
  if (isUpdating) {
    update()
    return
  }
  isUpdating = true

  update()
  storesToNotify.add(internals as StoreInternals<unknown>)
  for (const storeToNotify of storesToNotify) {
    storeToNotify.listeners.forEach((listen) => {
      console.log(listen)
      listen(storeToNotify.state)
    })
  }
  isUpdating = false
}

