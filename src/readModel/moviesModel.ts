import { existsSync, createReadStream, createWriteStream } from "fs"
import { createGunzip, createGzip } from "zlib"
import { Movie } from '../shared/dsl'
import * as _ from 'lodash'

const MOVIES_PATH = (__dirname + `/../../database-movies.gz`)

/**
 * Returns objects of type

{
	"totalUserReviews": number,
	"avgUserReviews": number,
	"@context": "https://schema.org",
	"@type": "Movie",
	"name": "Little Women",
	"description": "Little Women draws on both the classic novel and the writings of Louisa May Alcott, and unfolds as the author\u2019s alter ego, Jo March, reflects back and forth on her fictional life.  In writer-director Greta Gerwig\u2019s take, the beloved story of the March sisters\u2014four young women each determined to live life on her own terms\u2014is both timeless and timely.  ",
	"datePublished": "December 25, 2019",
	"url": "https://www.metacritic.com/movie/little-women-2019",
	"image": "https://static.metacritic.com/images/products/movies/4/8aec15f2893bc8919ecb1882c3ad8b12-2400.jpg",
	"aggregateRating": {
		"@type": "AggregateRating",
		"bestRating": "100",
		"worstRating": "0",
		"ratingValue": "91",
		"ratingCount": "56"
	},
	"contentRating": "PG",
	"duration": "PT134M",
	"trailer": {
		"@type": "VideoObject",
		"name": "Little Women",
		"description": "Writer-director Greta Gerwig (Lady Bird) has crafted a Little Women that draws on both the classic novel and the writings of Louisa May Alcott, and unfolds as the author's alter ego, Jo March, reflects back and forth on her fictional life.  In Gerwig's take, the beloved story of the March sisters - four young women each determined to live life on her own terms -- is both timeless and timely.  Portraying Jo, Meg, Amy, and Beth March, the film stars Saoirse Ronan, Emma Watson, Florence Pugh, Eliza Scanlen, with Timoth\u00e9e Chalamet as their neighbor Laurie, Laura Dern as Marmee, and Meryl Streep as Aunt March.",
		"thumbnailUrl": "https://content.internetvideoarchive.com/content/photos/12500/482323_198.jpg",
		"uploadDate": "2019-12-20 15:44:00"
	},
	"director": [
		{
			"@type": "Person",
			"name": "Greta Gerwig",
			"url": "https://www.metacritic.com/person/greta-gerwig"
		}
	],
	"actor": [
		{
			"@type": "Person",
			"name": "Abby Quinn",
			"url": "https://www.metacritic.com/person/abby-quinn"
		},
		{
			"@type": "Person",
			"name": "Bob Odenkirk",
			"url": "https://www.metacritic.com/person/bob-odenkirk"
		},
		{
			"@type": "Person",
			"name": "Chris Cooper",
			"url": "https://www.metacritic.com/person/chris-cooper"
		},
		{
			"@type": "Person",
			"name": "Eliza Scanlen",
			"url": "https://www.metacritic.com/person/eliza-scanlen"
		},
		{
			"@type": "Person",
			"name": "Emma Watson",
			"url": "https://www.metacritic.com/person/emma-watson"
		},
		{
			"@type": "Person",
			"name": "Florence Pugh",
			"url": "https://www.metacritic.com/person/florence-pugh"
		},
		{
			"@type": "Person",
			"name": "James Norton",
			"url": "https://www.metacritic.com/person/james-norton"
		},
		{
			"@type": "Person",
			"name": "Jayne Houdyshell",
			"url": "https://www.metacritic.com/person/jayne-houdyshell"
		},
		{
			"@type": "Person",
			"name": "Laura Dern",
			"url": "https://www.metacritic.com/person/laura-dern"
		},
		{
			"@type": "Person",
			"name": "Louis Garrel",
			"url": "https://www.metacritic.com/person/louis-garrel"
		},
		{
			"@type": "Person",
			"name": "Meryl Streep",
			"url": "https://www.metacritic.com/person/meryl-streep"
		},
		{
			"@type": "Person",
			"name": "Saoirse Ronan",
			"url": "https://www.metacritic.com/person/saoirse-ronan"
		},
		{
			"@type": "Person",
			"name": "Timoth",
			"url": "https://www.metacritic.com/person/timoth"
		},
		{
			"@type": "Person",
			"name": "Tracy Letts",
			"url": "https://www.metacritic.com/person/tracy-letts"
		}
	],
	"publisher": [
		{
			"@type": "Organization",
			"name": "Columbia Pictures",
			"url": "https://www.metacritic.com/company/columbia-pictures"
		}
	],
	"genre": [
		"Drama",
		"Romance"
	]
}

 */

export class MoviesStore {
    private static allMovies: Movie[]
	private allMoviesTop: Movie[]
	private allMoviesMustSee: Movie[]
	
	private static instance: MoviesStore
    private database: Movie[] = []
	
	constructor(db){
		this.database = MoviesStore.allMovies||[]
	}

    static async getInstance(){
        if(!this.instance){
			const database = await this.all()
			this.instance = new MoviesStore(database) // must come last
        }
        return this.instance
	}

	static async allGenres(){
		const all = await this.all()
		let genres: Set<string> = new Set
		all.forEach(x => {
			if(!x.data.genre) return
			x.data.genre.forEach(genre => {
				genres.add(genre)
			})
		})
		return [...genres]
	}

	static async all(): Promise<Movie[]>{
		if(this.allMovies == undefined){

			if(!existsSync(MOVIES_PATH)) return Promise.resolve([])

			this.allMovies = await new Promise<Movie[]>((resolve, reject) => {
				let data = ''
				const fileContents = createReadStream(MOVIES_PATH);
				const unzip = createGunzip();
				const piped = fileContents.pipe(unzip)
		
				piped.on('data', (e) => {
					data += e.toString()
				})
				piped.on('end', (err) => {
					if (err) return reject(err);
					else resolve(JSON.parse(data).map(x => Movie.fromJSON(x)));
				})
			})

			this.allMovies = this.allMovies.filter(x => {
				return (x.data.datePublished||new Date).getTime() < Date.now()
			})
		}

		return this.allMovies
	}

	async all(){
		return MoviesStore.all()
	}

	async mustSee(){
		if(this.allMoviesMustSee == undefined){
			this.allMoviesMustSee = [...await this.all()]

			this.allMoviesMustSee = this.allMoviesMustSee.filter(x => x.getScore(0) > 70 && x.data.totalUserReviews > 20)
			this.allMoviesMustSee = _.orderBy(this.allMoviesMustSee, [
				(item: Movie) => item.getScore(0),
				(item: Movie) => item.interestLevelNumber
			], ['desc', 'desc'])
		}
		return this.allMoviesMustSee
	}

	async top(){
		if(this.allMoviesTop == undefined){
			this.allMoviesTop = [...await this.all()]
			this.allMoviesTop = _.orderBy(this.allMoviesTop, [
				yearScore, // closest to current year
				(item: Movie) => item.interestLevelNumber,
				(item: Movie) => (item.data.datePublished||new Date(1950)).getTime()
			], ['asc', 'desc', 'desc'])
		}
		return this.allMoviesTop
	}
	
	/**
	 * Update or insert movies
	 * @param movies 
	 */
	updateMovies(movies: Movie[]){
		movies.forEach((m, index) => {
			const exists = this.database.find(y => y.getId() == m.getId())
			if(exists){
				this.database[index] = exists
			}else{
				this.database.push(m)
			}
		})
		return new Promise((resolve, reject) => {
			const stream = createWriteStream(MOVIES_PATH)
			const zip = createGzip();
			zip.pipe(stream)
			zip.write(JSON.stringify(this.database, null, 4))
			zip.on('finish', resolve)
			stream.on('finish', resolve)
			zip.end()
			stream.end()
		})
	}

    byMetacriticUrl(murl){
        return this.database.find(x => x.data.url == murl)
    }
}

function yearScore(a: Movie){
	const thisYear = new Date().getFullYear()
	return thisYear - (a.data.datePublished||new Date(1950)).getFullYear()
}