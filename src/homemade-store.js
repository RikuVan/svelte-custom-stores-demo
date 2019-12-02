// a store is a simple event bus
// it has to have a `subscribe` method
// and if you want to set values, e.g. `$state = false`, the a `set` method
// the rest is up to you

function homemadeStore(value) {
  let subscribers = []
  let state = value
  return {

    subscribe(listener) {
      subscribers.push(listener)
      return () => {
        const index = subscribers.indexOf(subscriber)
        if (index !== -1) {
          subscribers.splice(index, 1)
        }
      }
    },

    set(newValue) {
      if (state !== newValue) state = newValue
      if (subscribers.length > 0) {
        subscribers.forEach(s => s(state))
      }
    }
  }
}

export const state = homemadeStore(false)