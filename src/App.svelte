<script>
	import Layout from "./Layout.svelte"
	import {store} from "./reducer-store.js"
</script>

<Layout name="reducer_store" state={$store}>
	<div class="buttons">
		<button on:click={() => store.dispatch('SHOW')}>Show</button>

		<button on:click={() => store.dispatch('HIDE')}>Hide</button>
	</div>
</Layout>
