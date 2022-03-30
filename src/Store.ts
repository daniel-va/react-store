/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Store<STATE> {
  [x: string]: Action<STATE, any, any>
}

export interface Action<_STATE, I extends any[], O> {
  (...args: I): O
}

export type StateOf<STORE> = STORE extends Store<infer STATE> ? STATE : never
