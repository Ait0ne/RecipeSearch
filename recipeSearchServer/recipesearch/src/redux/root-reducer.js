import {combineReducers} from 'redux';
import searchReducer from './search/search.reducers';
import paginationReducer from './pagination/pagination.reducers';
import loadingReducer from './loading/loading.reducer';

const rootReducer = combineReducers({
    search: searchReducer,
    pagination: paginationReducer,
    loading: loadingReducer
});

export default rootReducer;