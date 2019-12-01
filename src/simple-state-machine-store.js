import { writable } from 'svelte/store'

export const machine = ({ init, states }) => {
	if (!states.hasOwnProperty(init)) throw new Error(`That isn't a state, choose a real init state!`)
	let current_state = init
	const { subscribe, set, update } = writable(current_state)

	const send = (event) => {
		if (!states[current_state].on[event]) {
			console.log('no such event')
			return
		}

		if (!states[states[current_state].on[event]]) {
			console.log('no such state')
			return
		}
		current_state = states[current_state].on[event]
		set(current_state)
	}

	return {
		subscribe,
		send
	}
}

const state_config = {
	init: 'invisible',
	states: {
		visible: {
			on: {
				HIDE: 'invisible'
			}
		},
		invisible: {
			on: {
				SHOW: 'visible'
			}
		}
	}
}

export const state = machine(state_config)
