import { writable } from 'svelte/store'

const createPersistedStore = (key, defaultValue) => {
	const initialJson = localStorage.getItem(key)
	const initialValue = initialJson ? JSON.parse(initialJson) : defaultValue
	const store = writable(initialValue)

	const subscribe = (fn) =>
		store.subscribe((current) => {
			localStorage.setItem(key, JSON.stringify(current))
			return fn(current)
		})

	return {
		subscribe,
		set: store.set
	}
}

export const store = createPersistedStore('dogs', { visible: false, dogs: 0 })
