import React from 'react';
import './search-form.css';
import axios from 'axios';
import {connect} from 'react-redux';
import {setSearchResults} from '../../redux/search/search.actions';
import Autocomplete from '../autocomplete/autocomplete.component';
import {RadioGroup, Radio, FormControlLabel, Popover, Typography, Collapse} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import HelpIcon from '@material-ui/icons/Help';
import {motion, AnimatePresence} from 'framer-motion';

import {setLastQuery, setPageCount, setCurrentPage, setResultCount} from '../../redux/pagination/pagination.actions';
import {toggleLoading} from '../../redux/loading/loading.actions';
import {API_URL} from '../../config'; 


const FormVariants = {
    visible: {
        opacity: 1,
        transition: {
            duration: 0.4,
            when: 'afterChildren'
        }        
    },
    hidden: {
        opacity: 0,
        transition: {
            duration: 0.4,
            when: 'beforeChildren'
        }        
    }
}

const GreenRadio = withStyles({
    root: {
      color: '#abbf03',
      '&$checked': {
        color: '#abbf03',
      },
    },
    checked: {},
  })((props) => <Radio color="default"  {...props} />);

const GreenHelpIcon = withStyles({
    colorPrimary: {
        color: '#abbf03',
        cursor: 'pointer',

    }
})((props) => <HelpIcon color='primary' {...props}/>);

const StyledTypography =  withStyles({
    subtitle2: {
        padding: '15px',
        color: 'black',
        width: '200px',
        fontFamily: 'Lobster',
    }
})((props) => <Typography variant='subtitle2' {...props}/>)


class SearchForm extends React.Component {
    constructor() {
        super()
        this.state = {
            titleSearch: '', 
            ingredientSearch: [],
            detailSearchHidden: true,
            searchType: 'flex', 
            anchorEl: null,
            
        }
    }

    autocompleteRef  = React.createRef()
    
    handleSubmit = event => {
        const {titleSearch, ingredientSearch, searchType} = this.state
        const {setSearchResults, setCurrentPage, setLastQuery, setPageCount, perPage, toggleLoading, setResultCount} = this.props
        toggleLoading();
        event.preventDefault()
        axios.post(`${API_URL}db`, {
            titleSearch: titleSearch,
            ingredientSearch: ingredientSearch, 
            searchType: searchType, 
            perPage: perPage,
            currentPage: 1, 
            initialQuery:true
        })
        .then(response => {
            setSearchResults(response.data.results)
            setLastQuery({ titleSearch: titleSearch, ingredientSearch: ingredientSearch, searchType: searchType })
            setCurrentPage(1)
            setPageCount(response.data.totalPageCount)
            setResultCount(response.data.resultCount)
            setTimeout(() => {

                window.scrollTo({top: this.state.detailSearchHidden? 680 : 850, behavior: 'smooth'})   
                toggleLoading()  
                 
            }, 200);
            
            })
        .catch(err => {
            console.log(err)
            toggleLoading()
        })
        
    }

    handleTitleChange = (text) => {
        this.setState({titleSearch:text})
    }

    handleIngredientChange = (options) => {
        const results = options.map(option => option.title? option.title:option)
        this.setState({ingredientSearch:results})

    }

    toggleDetailSearch = () => {
        this.autocompleteRef.current.clear()
        this.setState({detailSearchHidden:!this.state.detailSearchHidden, ingredientSearch:[]})

    }
    
    handleSearchTypeChange = event => {
        this.setState({searchType: event.target.value})
    }

    handlePopover = (event) => {
        this.setState({anchorEl: event.currentTarget});
    }

    handlePopoverClose = () => {
        this.setState({anchorEl: null});
    }

    

    render() {

        const {detailSearchHidden, ingredientSearch, searchType, anchorEl} = this.state    
        return (

            <div className='main-container'>
                <motion.div className='main-form-container'
                key='main-form-container'
                initial={{ y: -200, opacity: 0}}
                animate={{ y: 0, opacity: 1, transition: {duration: 1}}}

                >
                    <motion.div
                    initial={{opacity:0, y: -150}}
                    animate={{opacity:1, y:0, transition: {duration:1.5}}}
                    >
                        <p  className='pre-title-text'>
                            <span>Ищите Рецепты с ваших любимых кулинарных сайтов</span>
                            <span>в одном месте</span>
                        </p>
                        {console.log('ingr', ingredientSearch)}
                        <p className='title-text'>
                            Поиск
                        </p>
                        <p className='title-text'>
                            Рецептов
                        </p>
                    </motion.div>
                </motion.div>
                <motion.div className='search-field-container' 
                key='search-field-container'
                initial={{opacity:0, y:200}}
                animate={{opacity:1,y:0, transition: { duration: 1}}}
                >
                    <span className='search-form-title'>Поиск по названию:</span>
                    <motion.form 
                    onSubmit={this.handleSubmit}
                    >
                        <div className='title-search-form-container'>
                            <Autocomplete handleChange={this.handleTitleChange} handleSubmit={this.handleSubmit} url='titleoptions' placeholder='Введите название блюда...' />
                            <button className='search-button' type='submit'>Поиск</button>
                        </div>
                    <Collapse in={!detailSearchHidden}>
                        <motion.div className='detail-search-container'
                        initial={{height:0,opacity: 0}}
                        animate={{height: 'auto',opacity: 1, transition: {duration: 0.4}}}
                        exit={{height: 0,transition: {duration: 0.4}}}

                        >
                            <span className='search-form-title'>Поиск по ингредиентам:</span>
                            <Autocomplete ref={this.autocompleteRef} handleChange={this.handleIngredientChange} url='ingredientoptions' placeholder='Введите название ингредиента...' multiple={true} allowNew={true} />
                            <RadioGroup aria-label='Тип поиска:' name='searchType' value={searchType} onChange={this.handleSearchTypeChange}>
                                <FormControlLabel value='flex' control={<GreenRadio/>} label='Простой поиск' color='white'/>
                                <FormControlLabel value='hard' control={<GreenRadio/>} label='Строго выбранные ингредиенты'/>
                                <div style={{display:'flex'}}>
                                    <FormControlLabel value='medium' control={<GreenRadio/>} label='Выбранные ингредиенты + основные специи'/> 
                                    <GreenHelpIcon onClick={this.handlePopover}/> 
                                    <Popover
                                    open={Boolean(anchorEl)}
                                    anchorEl={anchorEl}
                                    onClose={this.handlePopoverClose}   
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    transformOrigin={{
                                        vertical: 'center',
                                        horizontal: 'left',
                                    }}>
                                        <StyledTypography>Соль, Перец, Сахар, Масло растительное, Вода, Ваниль, Корица, Мускатный орех, Сода, Паприка</StyledTypography>
                                    </Popover>
                                </div>
                            </RadioGroup>
                        </motion.div>
                        </Collapse>
                    </motion.form>
                    <span className='detailed-search-button' onClick={this.toggleDetailSearch}>{detailSearchHidden? 'Расширенный Поиск': 'Скрыть Расширенный Поиск'}</span>

                </motion.div>
            </div>
        )
    }
}
const mapStateToProps = state => ({
    perPage: state.pagination.perPage,
})

const mapDispatchToProps = dispatch => ({
    setSearchResults: results => dispatch(setSearchResults(results)),
    setCurrentPage: page => dispatch(setCurrentPage(page)), 
    setLastQuery: query => dispatch(setLastQuery(query)),
    setPageCount: pageCount => dispatch(setPageCount(pageCount)),
    toggleLoading: () => dispatch(toggleLoading()),
    setResultCount: num => dispatch(setResultCount(num))
})


export default connect(mapStateToProps, mapDispatchToProps)(SearchForm);
