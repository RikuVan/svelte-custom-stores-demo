# Why are there so many `$`s in Svelte code and how to get the most out of them.

Blog post draft
---

Shortly after the release of Svelte version 3, I watched [Rethinking reactivity](https://svelte.dev/blog/svelte-3-rethinking-reactivity) by Rich Harris. Rich is both provocative and convincing, so I ran through the [tutorial](https://svelte.dev/tutorial/basics) and started remaking our [meetup site UI](https://www.webdevandsausages.org/) in Svelte. As a tool, Svelte felt both ergonomic and and easy to apply right away to difficult problems. In this case, the tool is mainly a compiler, reducing your framework code into vanilla javascript. There is a bit of magic happening; for example, the compiler takes `$`s and turns them into subscriptions--more on that later. However, as my experiments started to grow in size, I wondered how to govern my app state more sanely. Svelte offers stores for managing state across components, but they comprise a relatively low-level api that do not enforce any conventions.

## Why custom stores?

The answer to the problem of creating stores that enforce conventions, such as stores that constrain updates, is only very briefly discussed in a [Svelte doc example](https://svelte.dev/examples#custom-stores) in terms of `custom stores`. I would like to continue in this post where the docs leave off, offering some further examples of how to make your Svelte stores into something more robust and scalable for large applications.

## The Svelte `$` and the subscription contract

Arguably what is interesting about Svelte's approach to state management is not the store itself but the auto-subscription that is possible because of the Svelte compiler. By simply appending a `$` to a variable in a component, the compiler will know to expect an object with a subscribe method on it and generate the boilerplate of subscribing and unsubscribing for you. Once you start using this auto-subscription feature, you will wonder how you ever lived without it--the `$`s will flow. So for the `$` to work with any `store`, the [contract](https://svelte.dev/docs#4_Prefix_stores_with_$_to_access_their_values) requires your object has a `subscribe` method which takes a callback and returns an unsubscribe function. Moreover, if there is a `set` method, the compiler will use this for updates. Try making your own naive little event bus--that is all it really is--and you will see it just works.

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

export const state = myStore(false)
```

Now we can make use of auto-subscription. Without it we would have to do this.

```js
<script>
  import {onDestroy} from 'svelte'
  import {state} from './homemade-store.js'

  let visible = false

  const unsubscribe = state.subscribe(current => {
    visible = current
  })

  onDestroy(unsubscribe)
</script>

{#if visible}
  <p>Hello world</p>
{/if}
```

Instead all we need to do is this.

```js
<script>
  import {state} from './homemade-store.js'
</script>
{#if $state}
  <p>Hello world</p>
{/if}
```

## Svelte has a runtime and it is as skinny as ever

It is not that far to get from my naive store to the `writable` store shipped with Svelte: add an `update` method which works along the lines of React's `setState` by taking a function so you can merge your new state with the previous state, and add some optimizations and further subscription cleanup. In addition to the `writable` store, there are also a `readable` store--just a writable store without the `set` and `update` methods, and a `derived` store which allows you to compute state from multiple stores. [The docs](https://svelte.dev/docs#svelte_store) explain the basic functionality of these purposefully slim stores so I will focus here more on how turn a basic writable store into something that better fits your needs.

## Hey, that looks a lot like an observable!?

Indeed, this simple contract is very close to that of an observable, such as those provided by [Rxjs](https://rxjs.dev/). `Set` is basically equivalent to `next` in the observable world. So if we like, we could replace our humble event bus above with an observable or a subject. I would prefer the `BehaviourSubject`, which allows us to kick off with an initial value.

```
import {BehaviorSubject} from "rxjs"

function observableStore(initial) {
	let store = new BehaviorSubject(initial)
	store.set = store.next
	return store
}

export const state = observableStore(false)
```

Now we can do all sorts of fancy things by piping our state updates through Rxjs operators, for example `store.pipe(debounceTime(400), take(5))`. If you are a huge fan of Rxjs, you might just stop reading here. But for me it is overkill in many cases.

## Constraining updates

The first simple step in creating a safer, scalable store, is to not allow your store's internal state to be directly over-written. Lets start with a simple set of buttons with which we can show or hide some components, in my example some dog pictures that pop up. At this point, you may want to follow along by cloning or looking at the [example repo](https://github.com/RikuVan/svelte-custom-stores-demo). There are branches with versions of the app working with different custom stores. I am not going to go through all the code, use to make this little app, but the key parts will be a `SimpleApp.js` (later FancyApp and on branches just App), `DogPopup.js` and a store--at this point we are just exporting a writable store `export state = writable(false)` in `basic-store.js`, which we use to update state in our button controls in `SimpleApp.svelte`.

```js
<div class="buttons">
  <button on:click={() => $state = true}>Show</button>
  <button on:click={() => $state = false}>Hide</button>
</div>
```

 At this point we can mutate state willy-nilly in any way we like; nothing prevents you from doing `$state = new GiantBrainFart()` somewhere. So maybe the plain `writable` is not always a good idea. Let's use some state-handling patterns popularized by Elm and Redux, without resorting to Redux itself (yet) to make this store a little safer. A first step would be to dispatch actions and update state via a reducer, something along the lines of `useReducer` in React. This is easy. So let's add the simplest possible reducer. We will just use strings for our actions instead of objects with a type property--we can improve this later. Still there is a built-in bonus, now that our updates are happening via a serializable type, we can use the redux dev tools. Let's do it.

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
We need to make a few updates to our buttons since we are now going to dispatch actions, `store.dispatch('SHOW')`, and everything should work as before. Check out the `reducer_store` branch and see the updates now in your dev tools.

At this point, you might be thinking that you would prefer full-blown Redux. And as it happens, it is not hard to make Redux work with the Svelte store contract. To see how this would work, have a look at `redux-store.js` and the `redux_store` branch. But I am not ready for that level of boilerplate yet, let's try some other things.

## Enforcing immutability

While by default Svelte's compiler does not assume we will not mutate objects directly, we can tell the compiler that all updates will be immutable.

`<svelte:options immutable={true}/>`

Now the compiler will be able optimize our code, ignoring deep mutations. We could try to ensure this manually in our reducer using the spread operator, or we could be lazy and use `Immer`. Let's be lazy. By wrapping updates in Immer's `produce` function, we can write easy-to-understand, imperative code, while ensuring that any updates we make result in a copied object. There are a few simple rules when using Immer, so it is worth reading [the Immer docs](https://immerjs.github.io/immer/docs/introduction). Let's create our immer store, but before we do that let's add a little more state to our app to make it more interesting. Now we will make the number of dog popup thingies dynamic with increment/decrement buttons. Right now our popup components are created in an `#each.../each` directive with a hard-coded list, `[1, 2]`. We will make it dynamic.

```js
{#each [...Array(state.dogs).keys()] as d (d)}
	<DogPopup idx={d} />
{/each}
```

If you are wondering about the odd looking `(d)`, this keys the component, ensuring that the compiler doesn't do any fancy sharing of objects that leads to surprising bugs. You don't often need to key items in Svelte, but I have run into some cases where it is essential. Now we are ready for our new immutable store.

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

The `produce` function takes an initial `base state` followed by an update function in which Immer passes the `draft state` to the update function, so it may be a bit tricky to see what is happening in the update method at first glance. Immer's `produce` also has a curried version which we will use later. Here is one way you could use it in your buttons.

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

We are getting close to where we would like to be, but to be honest I would personally not use anything we have seen so far as is. What I would like to do is have the guarantees that come with being limited to flux-like actions with a type and payload together with Immer's goodness, without all the boilerplate that comes with Redux. Taking inspiration from a react hook I like called [useMethods](https://github.com/pelotom/use-methods), let's try to achieve something similar.

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

Now we have our immutability and simple state updates thanks to `Immer` plus the guarantee that updates happen via actions, like so `actions.show()` in our button. Notice that with Immer you don't return from an action if mutating, only if returning new state. Inside our immer-store, we map over the actions argument, an object with update methods, to wrap each method in `produce` which is wrapped by the writable's `update`. We will return only these actions from the store, together with the subscribe method. Now things are relatively uncomplicated but constrained. This will work for me in simpler cases. But at some point we will run into new requirements. Maybe we can only add dogs when they are visible and of course we want to avoid having negative dogs or too many dogs for the screen.

## Time to get serious - a state machine

What we want now is the ability to ensure that certain actions are only dispatched in states where they are allowed to happen. We also want to guard against certain unintended updates, e.g. negative dogs. It's time for a full-blow state machine. While we could create our little homemade state machine (see `simple-state-machine-store.js` which is copied from a version posted in the Svelte Discord server) or we could just use `Xstate` which adheres to the SCXML specification and provides a lot of extra goodness, including visualization tools, test helpers and much more. Xstate also provides its own interpreter. So, as is the case in most custom stores, all we need to do is make sure Xstate works with the Svelte store contract. Here is one way we could do this.

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
	if (event.type === "DEC" && ctx.dogs <= 0) return false
	if (event.type === "INC" && ctx.dogs >= 6) return false
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
					INC: {internal: true, actions: increment, cond: dogsCanChange},
					DEC: {internal: true, actions: decrement, cond: dogsCanChange}
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

There is quite a bit going on here that is very specific to Xstate: the definition of the machine, the updates of the machine context, the definition of guards, and so on. I will point you to the [Xstate docs](https://xstate.js.org/docs/guides/start.html) to get a handle on all that. In this case, we can use a `readable` store (just as with Redux) to make Xstate conform to the contract because Xstate has its own eventing system for updates. The `readable` store takes a function as a second argument which has its own internal `set` method, allowing us to wrap any api, like Xstate or Redux that has its own built in subscription model but with a slightly different api. In this case, we need to ensure that we call `start` and `stop`. There are certainly other ways to accomplish this without using a Svelte store at all. A custom svelte store can be truly custom. To make this work in our code we now need to use, eg., `store.send('SHOW')` in our click handlers and our flags around now on `store.context`. Checkout the `xstate_store` branch to poke it a bit.

## Now your `$`'s and your stores

I hope you have seen what a little compiler magic and a simple, well-thought api can accomplish. The `store contract` and the runtime offered by Svelte should not be seen as the end of state management with Svelte, but the beginning. I look forward to what is coming as new custom stores pop up in user land, adaptations of your preferred state management patterns or libraries or then something really new. Please share your ideas with the rest of us.

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
