<script>
	import Layout from "./Layout.svelte"
	import {store} from "./immer-actions-store.js"
	const {actions} = store
</script>

<Layout name="immer-actions-store" state={$store}>
	<div class="buttons">
		<button on:click={actions.show}>Show</button>

		<button on:click={actions.hide}>Hide</button>
	</div>
	<div class="buttons">
		<button on:click={actions.inc}>+</button>

		<button on:click={actions.dec}>-</button>
	</div>
</Layout>
