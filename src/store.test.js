import {store} from "./immer-actions-store.js"

const {actions} = store

test("example store test", () => {
	let current = undefined
	store.subscribe(val => {
		current = val
	})
	actions.inc()
	actions.show()
	expect(current).toEqual({visible: true, dogs: 1})
})
