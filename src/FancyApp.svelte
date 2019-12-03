<script>
	import Layout from "./Layout.svelte"
	import {state} from "./immer-store.js"

	function toggleVisibility(isVisible) {
		state.update($state => {
			$state.visible = isVisible
		})
	}
	function changeDogs(change) {
		state.update($state => {
			if ($state.dogs >= 0) $state.dogs += change
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
