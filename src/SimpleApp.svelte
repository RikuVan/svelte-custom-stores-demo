<script>
	import Layout from "./Layout.svelte"
	import {state} from "./basic-store.js"
</script>

<Layout name="basic-store" state={$state}>
	<div class="buttons">
		<button on:click={() => ($state = true)}>Show</button>
		<button on:click={() => ($state = false)}>Hide</button>
	</div>
</Layout>