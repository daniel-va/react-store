/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Actions,
  CreateActions,
  Store, storeSymbol,
} from './Store'

export const createStore = <STATE, ACTIONS extends Actions>(
  createInitialState: () => STATE,
  createActions: CreateActions<STATE, ACTIONS>,
): Store<STATE, ACTIONS> => {
  return {
    initialState: createInitialState,
    actions: createActions,
    [storeSymbol]: true,
  }
}
