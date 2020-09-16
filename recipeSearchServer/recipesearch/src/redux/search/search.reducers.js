const INITIAL_STATE = {
    searchResults: []
}


const searchReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_SEARCH_RESULTS':
            return {
                ...state, 
                searchResults: action.payload
            };
        default:
            return state;
    }
}

export default searchReducer;