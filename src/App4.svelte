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
			if (dogs >= 0) $state.dogs = dogs
		})
	}

	$: dogs = $state.dogs
</script>

<Layout name="App4.svelte" state={$state}>
	<div class="buttons">
		<button on:click={() => toggleVisibility(true)}>Show</button>

		<button on:click={() => toggleVisibility(false)}>Hide</button>
	</div>
	<div class="buttons">
		<button on:click={() => changeDogs(dogs + 1)}>+</button>

		<button on:click={() => changeDogs(dogs - 1)}>-</button>
	</div>
</Layout>
