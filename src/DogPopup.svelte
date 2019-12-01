<script>
	import { scale } from 'svelte/transition'
  import { store } from './xstate-store.js'

  const {state} = store


  export let idx = 1

  const getDog = async () => {
    const res = await fetch('https://dog.ceo/api/breeds/image/random')
    const data = await res.json()
    return data
  }

  let promise = getDog()

  $: if($state.matches('visible') && $state.context.dogs === idx) promise = getDog()
</script>

{#if $state.matches('visible')}
<!-- remove transition when using dynamic list-->
	<aside>
    {#await promise}
      <p>...waiting</p>
    {:then data}
    <h3>Dog {idx}</h3>
     <img src={data.message} />
    {:catch error}
      <p style="color: red">{error.message}</p>
    {/await}
  </aside>
{/if}

<style>
  aside {
		height: 330px;
		width: 330px;
		color: #eee;
		font-weight: 500;
		font-size: 20px;
		text-transform: uppercase;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin: 50px auto;
		border-radius: 5px;
    background: cadetblue;
	}

  img {
		max-height: 250px;
		max-width: 300px;
	}
</style>