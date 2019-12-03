import { readable } from 'svelte/store'
import { interpret, createMachine, assign } from '@xstate/fsm'

const increment = assign({
	dogs: (context) => context.dogs + 1
})
const decrement = assign({
	dogs: (context) => context.dogs - 1
})
const dogsCanChange = (ctx, event) => {
	if (event.type === 'DEC' && ctx.dogs <= 0) return false
	if (event.type === 'INC' && ctx.dogs >= 6) return false
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
					INC: { internal: true, actions: increment, cond: dogsCanChange },
					DEC: { internal: true, actions: decrement, cond: dogsCanChange }
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
