# Svelte stores - whatever you want them to be

Blog post draft
---

Shortly after the release of Svelte version 3, I watched the [Rethinking reactivity](https://svelte.dev/blog/svelte-3-rethinking-reactivity) by presentation Rich Harris and I was impressed enough to have a run through the tutorial and start building a side-project in Svelte. It felt that with Svelte I was able to create UI's concisely, and I liked it's small kb footprint as well thanks to its compiler. However, as soon as my project started to grow I started to wonder how to govern the state more sanely than just passing props. Svelte offers stores for managing state across components, but they comprise a relatively low-level api that do not enforce any conventions.

## Why custom stores?

The answer to the problem of creating stores that enforce conventions--more exactly stores that constrain updates--is only very briefly discussing in the Svelte docs in terms of `custom stores`. I would like to continue here where the docs leave off, offering some simple examples of how to make your Svelte stores into something more robust and scalable for large applications.

## The Svelte subscription contract

Arguable what is interesting about Svelte's approach to state management is not the store itself but the auto-subscription that is possible because of the Svelte compiler. By simply appending a `$` to a variable in a component, the compiler will know to expect an object with a subscribe method on it and generate the boilerplate of subscribing and unsubscribing for you. Once you start using this auto-subscription feature, you will wonder how you ever lived without it. So for any `store` to work, the [contract](https://svelte.dev/docs#4_Prefix_stores_with_$_to_access_their_values), requires your object has a `subscribe` function which takes a callback and returns an unsubscribe method. Moreover, if there is a `set` method, the compiler will use this for updates. Try making your own naive little event bus and you will see it just works.

```js
function myStore(value) {
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
```

## The Svelte runtime stores

It is not that far, to get from my naive version above to Svelte `writable` store. Some optimizations, an `update` method which works along the lines of React's setState by taking a function so you can merge your new state with the previous state, and some cleanup. In addition to the writable store, there are also a `readable` store, a writable store without the set and update, and a `derived` store which allows you to compute state from multiple stores. The docs explain all these stores and I will focus here more on how iterate on a basic writable store to create something new.

## Hey, that looks a lot like an observable, doesn't it?

Indeed, fortunately this simple contract is very close to that of an observable, such as those provided by Rxjs. `Set` is basically equivalent to `next`. So if we like we could replace our crappy event bus with a `BehaviourSubject`.

```
import {BehaviorSubject} from "rxjs"

function observableStore(initial) {
	let store = new BehaviorSubject(initial)
	store.set = store.next
	return store
}

export const state = observableStore(false)
```

Now we can do all sorts of fancy things by piping our state updates through Rxjs operators, for example `store.pipe(debounceTime(400), take(5))`.

## Constraining updates

But introducing a Rxjs is a big change and potentially overkill. The first simple step in creating a safer, scable store, is to not allow your store's internal state to be directly over-written. Lets start with a simple set of buttons with which we can show or hide some components, in my odd example, some dog pictures that pop up. At this point we are just exporting a writable store `export state = writable(false)`, which we use in with our button controls in our `SimpleApp.svelte`.

```js
<div class="buttons">
  <button on:click={() => $state = true}>Show</button>
  <button on:click={() => $state = false}>Hide</button>
</div>
```

 At this point we can mutate state willy-nilly in any way we like; this is probably not a good idea. Let's use some concepts popularized by Redux, without resorting to Redux itself (yet) to make this store a little safer. A first step would be to dipatch actions and update via a reducer, something along the lines of `useReducer` in React. This is easy. Lets start with a simple set of buttons with which we can show or hide some components, in my odd example, some dog pictures that pop up. At this point, you may want to follow along by cloning or looking at the [example repo](https://github.com/RikuVan/svelte-custom-stores-demo)(there are branches with versions of the app working with different custom stores). So let's add the simplest possible reducer. We will just use strings for our actions instead of objects with a type property--we can improve this later. Still there is a built-in bonus, now that our updates are happening via a serializable type, we can use the redux dev tools. Let's do it.

```js
function createStore(init, reducer) {
	const devTools =
		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__.connect()

	const {update, subscribe} = writable(init)

	function dispatch(action) {
		update(state => {
			devTools.send(action, state)
			return reducer(state, action)
		})
	}

	return {
		subscribe,
		dispatch
	}
}

function reducer(state, action) {
	switch (action) {
		case "SHOW":
			return true
		case "HIDE":
			return false
		default:
			return state
	}
}

export const store = createStore(false, reducer)

```
Then we would need to make a few changes to our buttons, since we are not going to dispatch actions, e.g `store.dispatch('SHOW')`, and everything should work as before. Check out the updates in your dev tools.

At this point, you might be thinking that I would prefer full-blown Redux. And as it happens, it is not hard to make Redux work with the Svelte store contract. To see how this would work, have a look at `redux-store.js` and the `redux_store` branch.

## Enforcing immutability

While by default Svelte's compiler does not assume we will not mutate objects directly, we can tell the compiler that all updates will be immutable.

`<svelte:options immutable={true}/>`

Now the compiler will optimize our code by expecting us to always return new objects, when updating state. We could try do this manually in our reducer store, or we be lazy and use `Immer`. By wrapping updates in Immer's `produce` function, we can write easy to understan, imperative code, while ensuring that any updates we make result to a copied object. There are a few simple rules when using Immer, so it is worth reading the docs. Let's create our immer store, but before we do that let's add a little more state to our app to make it more interesting. Now we will make the number of dog popup thingies dynamic with increment/decrement buttons. Right now our popup components are created in an `#each` directive with a hard-coded list. We will make it dynamic.

```
{#each [...Array(state.dogs).keys()] as d (d)}
	<DogPopup idx={d} />
{/each}
```

If you are wondering about the odd looking `(d)`, this keys the component, ensuring they are not sharing anything / optimized by the compiler. You don't often need to key items in Svelte, but sometimes it is essential and the resulting bugs can be hard to understand at first. Now we are ready for our new immutable store.

```js
import {writable} from "svelte/store"
import produce from "immer"

const immerStore = value => {
	const store = writable(value)

	function set(new_value) {
		if (new_value !== value) {
			store.set((value = new_value))
		}
	}

	return {
		set,
		update: fn => set(produce(value, fn)),
		subscribe: store.subscribe
	}
}

export const state = immerStore({visible: true, dogs: 0})

```

The `produce` function is curried, so it may be a bit tricky to see what is happening immediately in the update function. You will pass in a function, together with the previous state, that will then take a new state. Here is one way you could use it in your buttons.

```js
<script>
	import Layout from "./Layout.svelte"
  import {state} from "./immer-store.js"
  
	function toggleVisibility(isVisible) {
		state.update($state => {
			$state.visible = isVisible
		})
	}
	function changeDogs(dogs) {
		state.update($state => {
			$state.dogs += dogs
		})
	}
</script>

<svelte:options immutable={true} />

<Layout name="immer-store" state={$state}>
	<div class="buttons">
		<button on:click={() => toggleVisibility(true)}>Show</button>
		<button on:click={() => toggleVisibility(false)}>Hide</button>
	</div>
	<div class="buttons">
		<button on:click={() => changeDogs(1)}>+</button>
		<button on:click={() => changeDogs(-1)}>-</button>
	</div>
</Layout>
```

Now we are happily living in the land of immutable state. To see all the parts working with this store, checkout the `immer_store` branch.

## Combining actions with immutable state

Now we are getting close to where we would like to be, but to be honest I would use anything we have seen so far directly myself. What I would like to do is have the guarantee's that come with being limited to flux-like actions with a type and payload, without all the boilerplate that comes with pure redux. Taking inspiration from [useMethods](https://github.com/pelotom/use-methods) react hook try to achieve something similar.

```js
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
```

Now we have our immutability and simple state updates thanks to `Immer` plus the guarantee that updates happen via actions, like so `actions.show()` in our button. I personally fairly happy with this when things are relatively uncomplicated. However, at some point we will run into new requirements. Maybe we can only add dogs when they are visible and of course we want to avoid having negative dogs or too many dogs for the screen.

## A state machine store

What we want now is the ability to make sure that certain actions are only dispatched in states where they are allowed to happen. We also want to guard against certain unintended updates, e.g. negative dogs. It's time for a full-blow state machine. While we could create our only little state machine (see `simple-state-machine-store.js` which is copied from a version posted in the Svelte Discord server) or we could just use `XState` which adhears to the SCXML specification and provides a lot of extra goodness, including visualization tools, test helpers and much more. XState provides its own interpreter. So, as is the case in most custom stores, all we need to do is make sure Xstate works with the Svelte store contract. Here is one way we could do this.

```js
export {readable} from "svelte/store"
import {interpret, createMachine, assign} from "@xstate/fsm"

const increment = assign({
	dogs: context => context.dogs + 1
})

const decrement = assign({
	dogs: context => context.dogs - 1
})

const dogsCanChange = (ctx, event) => {
	if (event.type === "DEC" && ctx <= 0) false
	if (event.type === "INC" && ctx >= 0) false
	return true
}

export function useMachine(machine, options) {
	const service = interpret(machine, options)

	const store = readable(machine.initialState, set => {
		service.subscribe(state => {
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
		id: "dogs",
		initial: "visible",
		context: {dogs: 0},
		states: {
			visible: {
				on: {
					HIDE: "invisible",
					INC: {internal: true, actions: increment},
					DEC: {internal: true, actions: decrement}
				}
			},
			invisible: {
				on: {
					SHOW: "visible"
				}
			}
		}
	},
	{
		actions: {increment, decrement},
		guards: {dogsCanChange}
	}
)

export const store = useMachine(dog_machine)
```

There is quite a bit going on here that is very specific to Xstate, the definition of the machine, the updates of the machine context, the definition of guards, etc. I will point you to the Xstate docs to better understand what is going on. In this case, we can use a `readable` store (just as with Redux) to make Xstate conform to the contract because Xstate has its own eventing system for updates. The `readable` store takes a function as a second argument which has its own internal `set` method, allowing us to wrap any api, like Xstate or Redux that has its own built in subscription model but with a slightly different api. In this case, we need to ensure that we call `start` and `stop`. There are certainly other ways to accomplish this without using a Svelte store at all.

## The next generation of Svelte stores

I hope you have seen what a little compiler magic and a simple, well-thought api can accomplish. The store `contract` and the runtime stores offered by Svelte should not be seen as the end of state management with Svelte, but the beginning. Please play around and make your own custom store, or adopt your preferred to state management library to Svelte, and share your ideas with the rest of us.

---

## Get started

Install the dependencies...

```bash
cd svelte-app
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.


## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).


## Single-page app mode

By default, sirv will only respond to requests that match files in `public`. This is to maximise compatibility with static fileservers, allowing you to deploy your app anywhere.

If you're building a single-page app (SPA) with multiple routes, sirv needs to be able to respond to requests for *any* path. You can make it so by editing the `"start"` command in package.json:

```js
"start": "sirv public --single"
```


## Deploying to the web

### With [now](https://zeit.co/now)

Install `now` if you haven't already:

```bash
npm install -g now
```

Then, from within your project folder:

```bash
cd public
now deploy --name my-project
```

As an alternative, use the [Now desktop client](https://zeit.co/download) and simply drag the unzipped project folder to the taskbar icon.

### With [surge](https://surge.sh/)

Install `surge` if you haven't already:

```bash
npm install -g surge
```

Then, from within your project folder:

```bash
npm run build
surge public my-project.surge.sh
```
