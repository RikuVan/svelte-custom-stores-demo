import { readable } from 'svelte/store'
import { interpret, createMachine, assign } from '@xstate/fsm'

const increment = assign({
	dogs: (context) => context.dogs + 1
})
const decrement = assign({
	dogs: (context) => context.dogs - 1
})
const dogsCanChange = (ctx, event) => {
	if (event.type === 'DEC' && ctx <= 10) false
	if (event.type === 'INC' && ctx >= 0) false
	return true
}

export function useMachine(machine, options) {
	const service = interpret(machine, options)

	const store = readable(machine.initialState, (set) => {
		service.subscribe((state) => {
			if (state.changed) set(state)
		})

		service.start()

		return () => {
			service.stop()
		}
	})

	return {
		state: store,
		send: service.send
	}
}

const dog_machine = createMachine(
	{
		id: 'dogs',
		initial: 'visible',
		context: { dogs: 0 },
		states: {
			visible: {
				on: {
					HIDE: 'invisible',
					INC: { internal: true, actions: increment },
					DEC: { internal: true, actions: decrement }
				}
			},
			invisible: {
				on: {
					SHOW: 'visible'
				}
			}
		}
	},
	{
		actions: { increment, decrement },
		guards: { dogsCanChange }
	}
)

export const store = useMachine(dog_machine)
