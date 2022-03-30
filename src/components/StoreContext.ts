import { createContext } from 'react'
import { Stores } from '../index'
import { ActionsOf, AnyStore, StoreInternals } from '../Store'

export interface StoreContextState {
  internals: {
    [K in keyof Stores]: StoreInternals<Stores[K]>
  }
  actions: {
    [K in keyof Stores]: ActionsOf<Stores[K]>
  }
  storeMapping: Map<AnyStore, StoreInternals<AnyStore>>
  actionMapping: Map<ActionsOf<AnyStore>, StoreInternals<AnyStore>>
}

const StoreContext = createContext<StoreContextState | null>(null)
export default StoreContext
