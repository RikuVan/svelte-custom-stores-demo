<script>
	import Layout from "./Layout.svelte"
	import {store} from "./local-storage-store.js"
	const {actions} = store
</script>

<Layout name="local-storage-store" state={$store}>
	<div class="buttons">
		<button on:click={() => $store.visible = true}>Show</button>

		<button on:click={() => $store.visible = false}>Hide</button>
	</div>
	<div class="buttons">
		<button on:click={() => $store.dogs++}>+</button>
		<button on:click={() => $store.dogs--}>-</button>
	</div>
</Layout>
