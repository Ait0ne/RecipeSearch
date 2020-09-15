import React from 'react';
import './recipeCard.styles.css';
import ScrollBar from 'react-scrollbars-custom';

const RecipeCard = ({data}) => {
    return (

            <div  className='recipe-card'>
                <div className='card-image-container'>
                    <a href={data.url} target='_blank' rel="noopener noreferrer">
                        <img className='card-image' src={data.imageurl==='https://www.povarenok.ru/i/new3/mf-project/porject-img-6.png?v=1'?'/default.jpg':data.imageurl} alt={data.title}/>
                    </a>
                </div>
                <div className='card-body'>
                    <ScrollBar style={{height:'100%', width:'100%'}}>
                        <p className='card-title'>{data.title}</p>
                        <p className='ingredients'>
                            <span className='ingredients-title'>Ингредиенты:</span> 
                            {
                                data.array_agg.map((ingredient, index) => {
                                    return ' '.concat(ingredient[0][0].toUpperCase(),ingredient[0].slice(1),`${index===data.array_agg.length-1?'.':', ' }`)
                                })
                            }
                        </p>
                    </ScrollBar>
                </div>
            </div>
    )
}

export default RecipeCard;