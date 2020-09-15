import React from 'react';
import './App.css';
import {connect} from 'react-redux';
import {motion} from 'framer-motion';


import SearchForm from './components/SearchForm/search-form';
import RecipeContainer from './components/recipe-container/recipe-container.component';
import {Backdrop, CircularProgress} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}));



function App(props) {
  const classes = useStyles();
  const {searchResults, isLoading} = props
  return (
    <motion.div className="App"
    >
      <SearchForm/>
      {
        searchResults.length>0?
          <RecipeContainer/>
        : null
      }

      <Backdrop className={classes.backdrop}  open={isLoading}>
        <CircularProgress color='inherit'/>
      </Backdrop>
    </motion.div>
  );
}

const mapStateToProps = state => ({
  searchResults: state.search.searchResults,
  isLoading: state.loading.isLoading
})

export default connect(mapStateToProps)(App);
