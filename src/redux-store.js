import {createStore} from "redux"
import {readable} from "svelte/store"
import produce from "immer"

const initialState = {visible: false, dogs: 2}

const SHOW = "dogs/SHOW"
const HIDE = "dogs/HIDE"
const INC = "dogs/INCREMENT"
const DEC = "dogs/DECREMENT"

const actions = {
	show: () => ({type: SHOW}),
	hide: () => ({type: HIDE}),
	inc: () => ({type: INC}),
	dec: () => ({type: DEC})
}

const handlers = {
	[SHOW]: state => {
		state.visible = true
	},
	[HIDE]: state => {
		state.visible = false
	},
	[INC]: state => {
		state.dogs++
	},
	[DEC]: state => {
		state.dogs--
	}
}

const reducer = (state = initialState, action) =>
	handlers[action.type] ? produce(handlers[action.type])(state, action) : state

function createReduxStore(reducer, initialState) {
	const reduxStore = createStore(
		reducer,
		initialState,
		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
	)

	const state = readable(reduxStore.getState(), set => {
		const unsubscribe = reduxStore.subscribe(() => {
			set(reduxStore.getState())
		})
		return unsubscribe
	})

	return {
		subscribe: state.subscribe,
		dispatch: reduxStore.dispatch,
		actions
	}
}

export const store = createReduxStore(reducer, initialState)
