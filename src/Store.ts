/* eslint-disable @typescript-eslint/no-explicit-any */

export const storeSymbol = Symbol('store')

export interface Store<STATE, ACTIONS extends Actions> {
  initialState: () => STATE
  actions: CreateActions<STATE, ACTIONS>
  [storeSymbol]: true
}

export const isStore = <STATE, ACTIONS extends Actions>(value: unknown): value is Store<STATE, ACTIONS> => (
  value != null && (value as any)[storeSymbol] === true
)

export type AnyStore = Store<any, any>

export interface Actions {
  [x: string]: Action<any, any>
}

export interface Action<I extends any[], O> {
  (...input: I): O
}

export type ActionInput<ACTION>  = ACTION extends Action<infer I, any> ? I : never
export type ActionOutput<ACTION> = ACTION extends Action<any, infer O> ? O : never


export interface CreateActions<STATE, ACTIONS extends Actions> {
  (state: STATE, update: UpdateTrigger): ACTIONS
}

export interface UpdateTrigger {
  (apply: () => void): void
}


export type StateOf<STORE> = STORE extends Store<infer STATE, any> ? STATE : never
export type ActionsOf<STORE> = STORE extends Store<any, infer ACTIONS> ? ACTIONS : never

export interface StoreInternals<STORE extends AnyStore> {
  state: STORE
  update: UpdateTrigger
  readonly actions: Actions
  readonly hooks: Actions
  readonly listeners: Array<() => void>
}
