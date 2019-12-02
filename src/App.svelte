<script>
	import Layout from "./Layout.svelte"
	import {store} from "./redux-store.js"

	const {actions, dispatch} = store

	const handleClick = action => () => dispatch(action)
</script>

<svelte:options immutable={true} />

<Layout name="redux-store" state={$store}>
	<div class="buttons">
		<button on:click={handleClick(actions.show())}>Show</button>
		<button on:click={handleClick(actions.hide())}>Hide</button>
	</div>
	<div class="buttons">
		<button on:click={handleClick(actions.inc())}>+</button>
		<button on:click={handleClick(actions.dec())}>-</button>
	</div>
</Layout>
