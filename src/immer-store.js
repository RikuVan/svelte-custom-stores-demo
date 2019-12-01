import { writable } from 'svelte/store'
import produce from 'immer'

const immerStore = (value) => {
	const store = writable(value)

	function set(new_value) {
		if (new_value !== value) {
			store.set((value = new_value))
		}
	}

	return {
		set,
		update: (fn) => set(produce(value, fn)),
		subscribe: store.subscribe
	}
}

export const state = immerStore({ visible: true, dogs: 0 })
