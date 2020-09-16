const INITIAL_STATE = {
    lastQuery: {},
    perPage: 12,
    pageCount: 1,
    currentPage: 1,
    resultCount: 0
}

const paginationReducer = (state=INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_LAST_QUERY':
            return {
                ...state,
                lastQuery: action.payload
            }
        case 'SET_PER_PAGE':
            return {
                ...state,
                perPage: action.payload
            }
        case 'SET_PAGE_COUNT': 
            return {
                ...state,
                pageCount: action.payload
            }
        case 'SET_CURRENT_PAGE':
            return {
                ...state,
                currentPage: action.payload
            }
        case 'SET_RESULT_COUNT':
            return {
                ...state,
                resultCount: action.payload
            }
        default:
            return state
    }
}

export default paginationReducer;