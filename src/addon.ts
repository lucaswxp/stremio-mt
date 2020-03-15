
import "reflect-metadata"
import { MoviesStore } from "./readModel/moviesModel"
import { addonBuilder } from "stremio-addon-sdk"
import { tokenize, Movie } from "./shared/dsl"

enum Catalogs {
	Metacritic = 'metacritic-stremio',
	MustSee = 'metacritic-must-see'
}
export async function build(){
	const genres = await MoviesStore.allGenres()


	// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
	const manifest = {
		"id": "community.Metacritic",
		"version": "0.0.1",
		"catalogs": [
			{
				"type": "movie",
				"id": Catalogs.Metacritic,
				"name": "Metacritic",
				"genres": genres,
				"extraSupported": ['genre', 'skip', 'search'],
			},
			{
				"type": "movie",
				"id": Catalogs.MustSee,
				"name": "Must See (Metacritic)",
				"genres": genres,
				"extraSupported": ['genre', 'skip', 'search'],
			},
		],
		"resources": [
			"catalog"
		],
		"types": [
			"movie"
		],
		"name": "Metacritic Movie Catalog",
		"description": "Brings one of the most respected critics aggregators of the world to Stremio. Check critics scores and all \"Must See\" Movies recommended by Metacritic."
	}
	const builder = new addonBuilder(manifest)

	builder.defineCatalogHandler(async ({type, id, extra}) => {
		console.log("request for catalogs: "+(type||'')+" "+id, extra)
		// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/requests/defineCatalogHandler.md
		
		const MoviesModel = await MoviesStore.getInstance()
		
		let all: Movie[]


		if(id == Catalogs.Metacritic || !id){
			all = await MoviesModel.top()
		}else if(id == Catalogs.MustSee){
			all = await MoviesModel.mustSee()
		}else{
			console.log(`${id} catalog not recognized`)
		}

		// genre filter
		if(extra.genre){
			all = all.filter(x => (x.data.genre||[]).includes(extra.genre))
		}

		// search
		if(extra.search){
			const keywords = tokenize(extra.search)

			// simple pointing system for search
			const relevance = all.map(x => {
				let sum = 0
				for(let k of keywords){
					sum += x.data.name.toLocaleLowerCase().includes(k) ? 1 : 0
				}
				return {movie:x,sum}
			}).filter(x => x.sum > 0).sort((a,b) => b.sum - a.sum)
			all = relevance.map(x => x.movie)
		}

		// paging
		all = all.slice(extra.skip ? parseInt(extra.skip) : 0, 100)

		const metas = []
		all.forEach(x => {
			metas.push({
				id: x.imdbId||x.data.url,
				type: "movie",
				name: x.data.name + (x.data.datePublished ? ` (${x.data.datePublished.getFullYear()})` : ''),
				genres: x.data.genre,
				description: x.data.description,
				released: x.data.datePublished,
				website: x.data.url,
				poster: x.mtImage || x.getRemoteImage()
			})
		})
		return { metas: metas }
	})

	return builder
}