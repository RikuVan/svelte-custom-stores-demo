<script>
	import {scale} from "svelte/transition"
	// import { state } from './basic-store.js'
	//1 import { state } from './observable-store.js'
	//2 import { store }  from './reducer-store.js'
	//3 import { state } from './simple-state-machine-store.js'
	//4 import { state } from './immer-store.js'
	//5 import { store } from './xstate-store.js'
	import {store} from "./immer-actions-store.js"

	export let idx = 1

	const getDog = async () => {
		const res = await fetch("https://dog.ceo/api/breeds/image/random")
		const data = await res.json()
		return data
	}

	let promise = getDog()

	$: if ($store.visible && $store.dogs === idx) promise = getDog()
</script>

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

{#if $store.visible}
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
