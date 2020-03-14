
import "reflect-metadata"
import { MoviesStore } from "./readModel/moviesModel"
import { addonBuilder } from "stremio-addon-sdk"

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
			"movie",
			"series"
		],
		"name": "Metacritic Movie Catalog",
		"description": "Brings one of the most respected critics aggregators of the world to Stremio. Check critics scores and all \"Must See\" Movies recommended by Metacritic."
	}
	const builder = new addonBuilder(manifest)

	builder.defineCatalogHandler(async ({type, id, extra}) => {
		console.log("request for catalogs: "+type+" "+id)
		// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/requests/defineCatalogHandler.md
		
		const MoviesModel = await MoviesStore.getInstance()
		
		if(id == Catalogs.Metacritic){

		}else if(id == Catalogs.MustSee){

		}
		let all = await MoviesModel.all()
		if(extra.search){
			all = all.filter(x => {
				return x.data.name.includes(extra.search)
			})
		}
		all.sort((a,b) => (b.data.datePublished||new Date(1999)).getTime() - (a.data.datePublished||new Date(1999)).getTime())
		all.sort((a,b) => (b.getScore() ? 1 : 0) - (a.getScore() ? 1 : 0)) // movies that have no score go to bottom
		const metas = []
		all.forEach(x => {
			metas.push({
				id: x.imdbId||x.data.url,
				type: "movie",
				name: x.data.name,
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