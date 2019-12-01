<script>
	import Layout from "./Layout.svelte"
	import {state} from "./simple-state-machine-store.js"
</script>

<Layout name="simple-state-machine-store" state={$state}>
	<div class="buttons">
		<button on:click={() => state.send('SHOW')}>Show</button>

		<button on:click={() => state.send('HIDE')}>Hide</button>
	</div>
</Layout>
