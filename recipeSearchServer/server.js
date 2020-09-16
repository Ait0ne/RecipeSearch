const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const _ = require('underscore');
const morgan = require('morgan') 
const path = require('path');

// const db = knex({
//     client: 'pg', 
//     connection: {
//         host: 'localhost', 
//         user: 'postgres', 
//         password: 'fibonachi0%0',
//         database: 'scraper'
//     }
// })
const db = knex({
    client: 'pg', 
    connection: process.env.DATABASE_URL
})


const app = express();
const port = process.env.PORT || 5000;


app.use(morgan('combined'))
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

if (process.env.NODE_ENV==='production') {
    app.use(express.static(path.join(__dirname, 'recipesearch/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'recipesearch/build', 'index.html'))
    })
}

app.post('/db', (req, res) => {
    const {titleSearch, ingredientSearch, searchType, perPage, currentPage, initialQuery} = req.body
    let totalPageCount = null
    let resultCount = null
    console.log(currentPage)

    const hardAndEasyIngredientQuery = (query, withHardSearch, totalPageCount, resultCount) => {
        console.log(1)
        db
        .select('recepies.title',
        'recepies.imageurl',
        'recepies.url', 
        'recepies.ingredients', 
        'recepies.amount', 
        db.raw('ARRAY_AGG(ARRAY[ingredients.name, ritemp.amount])')
        )
        .from('recepies')
        .join('ritemp', 'ritemp.recepy_id', '=', 'recepies.id')
        .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
        .where('recepies.id','in', 
        db
        .raw(`${query}`)
        )
        .modify(withHardSearch)
        .groupBy('recepies.id')
        .orderBy('recepies.id', 'desc')
        .limit(perPage)
        .offset(perPage*(currentPage-1))
        .then(result => {
                res.status(200).json({results: result, totalPageCount: totalPageCount, resultCount:resultCount})     
        })
        .catch(err => {
            console.log(err)
            res.status(400).send({error:err})
        })
    }

    const mediumIngredientQuery = (ingrQuery, ingrSearchQuery, totalPageCount, resultCount) => {
        db
        .select('recepies.title', 'recepies.imageurl','recepies.url', 'recepies.ingredients', 'recepies.amount', db.raw('ARRAY_AGG(ARRAY[ingredients.name, ritemp.amount])'))
        .from('recepies')
        .join('ritemp', 'ritemp.recepy_id', '=', 'recepies.id')
        .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
        .where(
            'recepies.id','in', 
            db.select('ritemp.recepy_id')
            .from('ritemp')
            .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
            .groupBy('ritemp.recepy_id')
            .havingRaw(`ARRAY_AGG(ritemp.ingredient_id) <@ (SELECT array_agg(ingredients.id) FROM ingredients WHERE ${ingrQuery}) ${ingrSearchQuery} `)
        )
        .groupBy('recepies.id')
        .orderBy('recepies.id', 'desc')
        .limit(perPage)
        .offset(perPage*(currentPage-1))
        .then(result => {
            res.status(200).send({results: result, totalPageCount: totalPageCount, resultCount: resultCount})
        })
        .catch(err => {
            console.log(err)
            res.status(400).send({error:err})
        })
    }


    const titleAndIngredientQuery = (withIngredientSearch, withHardSearch, totalPageCount, resultCount) => {
        db
        .select('recepies.title', 'recepies.imageurl','recepies.url', 'recepies.ingredients', 'recepies.amount', db.raw('ARRAY_AGG(ARRAY[ingredients.name, ritemp.amount])'))
        .from('recepies')
        .join('ritemp', 'ritemp.recepy_id', '=', 'recepies.id')
        .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
        .where(db.raw("LOWER(recepies.title)"), 'like', db.raw(`LOWER('%${titleSearch}%')`))
        .modify(withIngredientSearch)
        .modify(withHardSearch)
        .groupBy('recepies.id')
        .orderBy('recepies.id', 'desc')
        .limit(perPage)
        .offset(perPage*(currentPage-1))
        .then(result => {
            res.status(200).send({results: result, totalPageCount: totalPageCount, resultCount:resultCount})
        })
        .catch(err => {
            console.log(err)
            res.status(400).send({error:err})
        })
    }


    if (titleSearch && titleSearch.length>0) {

        const withIngredientSearch = (queryBuilder) => {
            if (ingredientSearch.length>0) {

                if (searchType!=='medium') {


                    let query = ingredientSearch.map((ingredient, index)=>{ 
                        if (index===ingredientSearch.length-1) {
                        return `SELECT recepy_id FROM ritemp JOIN ingredients ON ingredients.id = ritemp.ingredient_id WHERE LOWER(ingredients.name) LIKE LOWER('${ingredient}%')`
                        } else {
                            return `SELECT recepy_id FROM ritemp JOIN ingredients ON ingredients.id = ritemp.ingredient_id WHERE LOWER(ingredients.name) LIKE LOWER('${ingredient}%') INTERSECT`
                        }
                    })
                    query = query.join(' ')
                    queryBuilder
                    .where('recepies.title','in',
                        db
                        .select('recepies.title',
                        )
                        .from('recepies')
                        .join('ritemp', 'ritemp.recepy_id', '=', 'recepies.id')
                        .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
                        .where('recepies.id','in', 
                        db
                        .raw(`${query}`)
                        )
                        
                    )
                } else {
                    let ingredients = ['соль','перец', 'сахар', 'масло растительное', 'вода', 'ваниль','ванилин','корица', "мускат", "сода",'паприка']
                    ingredients = ingredients.concat(ingredientSearch)
                    let ingrQuery = ingredients.map((i, index) => {
                        if (index !== ingredients.length-1) {
                            return ` LOWER(ingredients.name) LIKE LOWER('${i}%') OR `
                        } else {
                            return ` LOWER(ingredients.name) LIKE LOWER('${i}%')`
                        }
                    })
                    ingrQuery = ingrQuery.join(' ')
                    let ingrSearchQuery = ingredientSearch.map((i, index) => {
                            return ` AND ARRAY_AGG(ritemp.ingredient_id) && (SELECT array_agg(ingredients.id) FROM ingredients WHERE LOWER(ingredients.name) LIKE LOWER('${i}%') ) `
                    })
                    ingrSearchQuery = ingrSearchQuery.join(' ')
                    queryBuilder
                    .where('recepies.title', 'in', 
                    db
                    .select('recepies.title')
                    .from('recepies')
                    .join('ritemp', 'ritemp.recepy_id', '=', 'recepies.id')
                    .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
                    .where(
                        'recepies.id','in', 
                        db.select('ritemp.recepy_id')
                        .from('ritemp')
                        .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
                        .groupBy('ritemp.recepy_id')
                        .havingRaw(`ARRAY_AGG(ritemp.ingredient_id) <@ (SELECT array_agg(ingredients.id) FROM ingredients WHERE ${ingrQuery}) ${ingrSearchQuery} `)
                    )
                    )
                }
            }
        }
        const withHardSearch = (queryBuilder) => {
            if (searchType==='hard'&& ingredientSearch.length>0){
                queryBuilder
                .havingRaw(`ARRAY_LENGTH(ARRAY_AGG(ARRAY[ingredients.name, ritemp.amount]), 1)=${ingredientSearch.length}`)
            }
        }

        if (initialQuery) {
            db
            .select('recepies.title', 'recepies.imageurl','recepies.url', 'recepies.ingredients', 'recepies.amount', db.raw('ARRAY_AGG(ARRAY[ingredients.name, ritemp.amount])'))
            .from('recepies')
            .join('ritemp', 'ritemp.recepy_id', '=', 'recepies.id')
            .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
            .where(db.raw("LOWER(recepies.title)"), 'like', db.raw(`LOWER('%${titleSearch}%')`))
            .modify(withIngredientSearch)
            .modify(withHardSearch)
            .groupBy('recepies.id')
            .then(result => {
                totalPageCount = Math.ceil(result.length/perPage)
                resultCount = result.length
                titleAndIngredientQuery(withIngredientSearch, withHardSearch, totalPageCount, resultCount)
            })
            .catch(err => {
                console.log(err)
                res.status(400).send({error:err})
            })
        } else {
            titleAndIngredientQuery(withIngredientSearch, withHardSearch, totalPageCount, resultCount)
        }


        
    } else if (ingredientSearch.length>0) {
        if (searchType!=='medium'){
            let query = ingredientSearch.map((ingredient, index)=>{ 
                if (index===ingredientSearch.length-1) {
                return `SELECT recepy_id FROM ritemp JOIN ingredients ON ingredients.id = ritemp.ingredient_id WHERE LOWER(ingredients.name) LIKE LOWER('${ingredient}%')`
                } else {
                    return `SELECT recepy_id FROM ritemp JOIN ingredients ON ingredients.id = ritemp.ingredient_id WHERE LOWER(ingredients.name) LIKE LOWER('${ingredient}%') INTERSECT`
                }
            })
            query = query.join(' ')
            const withHardSearch = (queryBuilder) => {
                if (searchType==='hard'){
                    queryBuilder
                    .havingRaw(`ARRAY_LENGTH(ARRAY_AGG(ARRAY[ingredients.name, ritemp.amount]), 1)=${ingredientSearch.length}`)
                }
            }
            if (initialQuery) {
                db
                .select('recepies.title',
                'recepies.imageurl',
                'recepies.url', 
                'recepies.ingredients', 
                'recepies.amount', 
                db.raw('ARRAY_AGG(ARRAY[ingredients.name, ritemp.amount])')
                )
                .from('recepies')
                .join('ritemp', 'ritemp.recepy_id', '=', 'recepies.id')
                .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
                .where('recepies.id','in', 
                db
                .raw(`${query}`)
                )
                .modify(withHardSearch)
                .groupBy('recepies.id')
                .then(result => {
                    totalPageCount = Math.ceil(result.length/perPage)
                    resultCount = result.length
                    hardAndEasyIngredientQuery(query, withHardSearch,  totalPageCount, resultCount)
                })
            } else {
                hardAndEasyIngredientQuery(query, withHardSearch, totalPageCount, resultCount)
            }
        } else  {
            let ingredients = ['соль','перец', 'сахар', 'масло растительное', 'вода', 'ваниль','ванилин','корица', "мускат", "сода",'паприка']
            ingredients = ingredients.concat(ingredientSearch)
            let ingrQuery = ingredients.map((i, index) => {
                if (index !== ingredients.length-1) {
                    return ` LOWER(ingredients.name) LIKE LOWER('${i}%') OR `
                } else {
                    return ` LOWER(ingredients.name) LIKE LOWER('${i}%')`
                }
            })
            ingrQuery = ingrQuery.join(' ')
            let ingrSearchQuery = ingredientSearch.map((i, index) => {
                    return ` AND ARRAY_AGG(ritemp.ingredient_id) && (SELECT array_agg(ingredients.id) FROM ingredients WHERE LOWER(ingredients.name) LIKE LOWER('${i}%') ) `
            })
            ingrSearchQuery = ingrSearchQuery.join(' ')

            if (initialQuery) {
                db
                .select('recepies.title', 'recepies.imageurl','recepies.url', 'recepies.ingredients', 'recepies.amount', db.raw('ARRAY_AGG(ARRAY[ingredients.name, ritemp.amount])'))
                .from('recepies')
                .join('ritemp', 'ritemp.recepy_id', '=', 'recepies.id')
                .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
                .where(
                    'recepies.id','in', 
                    db.select('ritemp.recepy_id')
                    .from('ritemp')
                    .join('ingredients', 'ritemp.ingredient_id', '=', 'ingredients.id' )
                    .groupBy('ritemp.recepy_id')
                    .havingRaw(`ARRAY_AGG(ritemp.ingredient_id) <@ (SELECT array_agg(ingredients.id) FROM ingredients WHERE ${ingrQuery}) ${ingrSearchQuery} `)
                )
                .groupBy('recepies.id')
                .then(result => {
                    totalPageCount = Math.ceil(result.length/perPage)
                    resultCount = result.length
                    mediumIngredientQuery(ingrQery, ingrSearchQuery, totalPageCount, resultCount)
                })
            } else {
                mediumIngredientQuery(ingrQuery, ingrSearchQuery, totalPageCount, resultCount)
            } 
        }
    } else {
        res.status(400).send('Unknown Error!')
    }
})

app.post('/titleoptions', (req, res) => {
    const {searchQuery}= req.body
    if (searchQuery.length>0) {
        console.log(req.body)
        db
        .select('title')
        .from('recepies')
        .where(db.raw("LOWER(title)"), 'like', db.raw(`LOWER('%${searchQuery}%')`))
        .limit(10)
        .then(result => {
            console.log(result)
            res.status(200).json(result)
        })
        .catch(err => {
            console.log(err)
            res.status(400).send({error:err})
        })
        
    } 
})

app.post('/ingredientoptions', (req, res) => {
    const {searchQuery}= req.body
    if (searchQuery.length>0) {
        console.log(req.body)
        db
        .select('name')
        .from('ingredients')
        .where(db.raw("LOWER(name)"), 'like', db.raw(`LOWER('${searchQuery}%')`))
        .limit(10)
        .orderBy('counter', 'desc')
        .then(result => {
            console.log(result)
            res.status(200).json(result)
        })
        .catch(err => {
            res.status(400).send({error:err})
        })
        
    } 
})



app.listen(port, error => {
    if (error) throw error;
    console.log('Server running on port ' + port);
});
