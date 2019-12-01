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
