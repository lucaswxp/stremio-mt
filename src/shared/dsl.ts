import { Type, deserialize } from 'class-transformer'
import { v4 } from 'uuid';

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

    constructor(data: MovieData, crawledAt: Date, imdbId?: string){
        super()
        this.data = data
        this.imdbId = imdbId
        this.crawledAt = crawledAt
    }

    static fromJSON(plain: any){
        return deserialize(Movie, JSON.stringify(plain))
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

    getScore() {
        return this.data.aggregateRating ? parseInt(this.data.aggregateRating.ratingValue) : null
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