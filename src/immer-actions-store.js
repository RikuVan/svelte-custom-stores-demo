import {writable} from "svelte/store"
import produce from "immer"

const initialState = {
	visible: false,
	dogs: 0
}

const actions = {
	reset() {
		return initialState
	},
	show(state) {
		state.visible = true
	},
	hide(state) {
		state.visible = false
	},
	inc(state) {
		state.dogs++
	},
	dec(state) {
		if (state.dogs > 0) state.dogs--
	}
}

const immerActionsStore = (value, actions) => {
	const store = writable(value)

	const mappedActions = Object.keys(actions).reduce((acc, actionName) => {
		acc[actionName] = payload => store.update(state => produce(actions[actionName])(state, payload))
		return acc
	}, {})

	return {
		actions: mappedActions,
		subscribe: store.subscribe
	}
}

export const store = immerActionsStore(initialState, actions)
