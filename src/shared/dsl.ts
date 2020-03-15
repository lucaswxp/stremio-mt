import { Type, deserialize } from 'class-transformer'
import { v4 } from 'uuid';
import * as _ from 'lodash'


/**
 * Base class for Movies and TV Shows
 */
export class Picture {
    @Type(() => Date)
    crawledAt: Date
    imdbId: string
    scoreUsedGenerateImage: number|null
    mtImage: string
    private id: string

    getId(){
        return this.imdbId || this.id
    }
    
    constructor(){
        this.id = v4()
    }

    updateMtImage(mtImage: string, scoreUsed: number|null){
        this.scoreUsedGenerateImage = scoreUsed
        this.mtImage = mtImage
    }
}

export class Movie extends Picture {
    @Type(() => MovieData)
    data: MovieData
    tokenized: string[] = [] //used for search
    interestLevel: 'none'|'low'|'medium'|'high'|'veryhigh' // low < 20, medium < 100, high < 300, veryhigh > 300 
    interestLevelNumber = 0
    constructor(data: MovieData, crawledAt: Date, imdbId?: string){
        super()
        this.data = data
        this.imdbId = imdbId
        this.crawledAt = crawledAt
    }

    static fromJSON(plain: any){
        const dt = deserialize(Movie, JSON.stringify(plain))
        dt.tokenized = tokenize(dt.data.name)
        const total = dt.data.totalUserReviews || 0

        if(total == 0) dt.interestLevel = 'none'
        else if(total < 20) dt.interestLevel = 'low'
        else if(total < 100) dt.interestLevel = 'medium'
        else if(total < 300) dt.interestLevel = 'high'
        else dt.interestLevel = 'veryhigh'
        dt.interestLevelNumber = levels[dt.interestLevel]

        return dt
    }

    getRemoteImage(){
        return this.imdbId ? this.getImdbImage() : this.getMtImage()
    }

    getImdbImage(){
        return this.imdbId ? `https://images.metahub.space/poster/small/${this.imdbId}/img` : this.data.image
    }
    
    getMtImage(){
        return this.data.image
    }

    getScore(defaultVal = null) {
        return this.data.aggregateRating ? parseInt(this.data.aggregateRating.ratingValue) : defaultVal
    }
}

/**
 * Raw movie data from metacritic
 */
export class MovieData {
    url: string // metacritic url
    image: string
    name: string
    description: string
    @Type(() => Date)
    datePublished: Date // December 25, 2019
    aggregateRating: {
        ratingValue: string
    }
    genre: string[]
    totalUserReviews: number
    avgUserReview: number

    static fromJSON(plain: string){
        return deserialize(MovieData, (plain))
    }
}

export function getRelevance(keywords1: string[], keywords2: string[]){
	return _.intersection(keywords1, keywords2).length
}

export function tokenize(str: string){
	return str.replace(/[.!?\\\/"'+_()!,-]/g, ' ').toLowerCase().split(/\s+/)
}
const levels = {
    'none': 0,
    'low': 1,
    'medium': 2,
    'high': 3,
    'veryhigh': 4
}