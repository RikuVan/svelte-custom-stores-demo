import {BehaviorSubject} from "rxjs"
import {debounceTime, take} from "rxjs/operators"

function observableStore(initial) {
	let store = new BehaviorSubject(initial).pipe(debounceTime(400), take(5))
	store.set = store.next
	return store
}

export const state = observableStore(false)
