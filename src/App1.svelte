<script>
	import Layout from './Layout.svelte'
	import { state } from './basic-store.js'
	// import { state } from './observable-store.js'
</script>

<Layout name="App1.svelte" state={$state}>
	<div class="buttons">
		<button on:click={() => $state = true}>
			Show
		</button>

		<button on:click={() => $state = false}>
			Hide
		</button>
	</div>
</Layout>

