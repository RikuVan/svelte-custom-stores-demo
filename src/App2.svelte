<script>
	import Layout from "./Layout.svelte"
	import {store} from "./reducer-store.js"
</script>

<Layout name="App4.svelte" state={$store}>
	<div class="buttons">
		<button on:click={() => store.dispatch('SHOW')}>Show</button>

		<button on:click={() => store.dispatch('HIDE')}>Hide</button>
	</div>
</Layout>
