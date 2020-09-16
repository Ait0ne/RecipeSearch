import React from 'react';
import './recipe-container.styles.css'
import {connect} from 'react-redux';
import Pagination from '@material-ui/lab/Pagination'
import axios from 'axios';


import RecipeCard from '../recipeCard/recipeCard.component.jsx'
import {setCurrentPage,setPerPage, setPageCount} from '../../redux/pagination/pagination.actions';
import {setSearchResults} from '../../redux/search/search.actions';
import {toggleLoading} from '../../redux/loading/loading.actions';
import {API_URL} from '../../config';



const RecipeContainer = (props) => {
    const {searchResults, currentPage, perPage, pageCount, lastQuery, setCurrentPage, setSearchResults, toggleLoading, resultCount, setPerPage, setPageCount} = props

    const handleChange = (event, value) => {
        toggleLoading()
        axios.post(`${API_URL}db`, 
        {
            titleSearch: lastQuery.titleSearch,
            ingredientSearch: lastQuery.ingredientSearch, 
            searchType: lastQuery.searchType, 
            perPage: perPage,
            currentPage: value, 
        })
        .then(response=> {
            console.log(response)
            setSearchResults(response.data.results)
            setCurrentPage(value)
            setTimeout(() => {
                toggleLoading() 
                window.scrollTo({top: 850, behavior: 'smooth'})   
            }, 400);
            
        })
        .catch(err => {
            console.log(err)
            toggleLoading()
        })
    }

    const handlePerPageChange = ( num ) => {
        toggleLoading()
        axios.post(`${API_URL}db`, 
        {
            titleSearch: lastQuery.titleSearch,
            ingredientSearch: lastQuery.ingredientSearch, 
            searchType: lastQuery.searchType, 
            perPage: num,
            currentPage: 1, 
        })
        .then(response=> {
            console.log(response)
            setSearchResults(response.data.results)
            setPerPage(num)
            setCurrentPage(1)
            setPageCount(Math.ceil(resultCount/num))
            setTimeout(() => {
                toggleLoading()    
            }, 200);
            
        })
        .catch(err => {
            console.log(err)
            toggleLoading()
        })
    }

    return (
        <div className='recipe-container'>
            <div className='recipe-container-navigation'>
                <p>
                    <span >Найдено рецептов: </span>
                    <span style={{color: 'rgb(187, 110, 110)'}}>{resultCount}</span>
                </p>
                <p>
                    <span>Результатов на странице: </span>
                    <span className={`per-page-button ${perPage===12? 'active': ''}`}   onClick={perPage===12? null: () => handlePerPageChange(12)}>12 </span>
                    <span className={`per-page-button ${perPage===24? 'active': ''}`}   onClick={perPage===24? null: () => handlePerPageChange(24)}>24 </span>
                    <span className={`per-page-button ${perPage===48? 'active': ''}`}   onClick={perPage===48? null: () => handlePerPageChange(48)}>48 </span>
                </p>
            </div>
            
            <div className='recipe-inner-container'>
            {
                
                searchResults.map((result, index) => {
                    return <RecipeCard key={index} data = {result}/>
                })
                
            }
            </div>
            {
                pageCount>1?
                    <Pagination count={pageCount} page={currentPage} onChange={handleChange} variant='outlined' shape='round' color='primary' />
                :null
            }
        </div>
    )
}

const mapStateToProps = state => ({
    searchResults: state.search.searchResults,
    currentPage: state.pagination.currentPage,
    perPage: state.pagination.perPage,
    pageCount:state.pagination.pageCount,
    lastQuery:state.pagination.lastQuery,
    resultCount: state.pagination.resultCount
})

const mapDispatchToProps = dispatch => ({
    setCurrentPage: page => dispatch(setCurrentPage(page)),
    setPerPage: num => dispatch(setPerPage(num)), 
    setSearchResults: results => dispatch(setSearchResults(results)),
    toggleLoading: () => dispatch(toggleLoading()),
    setPageCount: num => dispatch(setPageCount(num))
})


export default connect(mapStateToProps, mapDispatchToProps)(RecipeContainer);
