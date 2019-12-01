<script>
	import Layout from './Layout.svelte'
	import { store } from './xstate-store.js'
	
  const { state, send } = store
</script>

<Layout name="xstate_store" state={$state}>
	<div class="buttons">
		<button on:click={() => send('SHOW')}>
			Show
		</button>

		<button on:click={() => send('HIDE')}>
			Hide
		</button>
  </div>
  <div class="buttons">
		<button on:click={() => send('INC')}>
			+
		</button>

		<button on:click={() => send('DEC')}>
			-
		</button>
	</div>
</Layout>