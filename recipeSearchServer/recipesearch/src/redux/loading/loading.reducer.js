const INITIAL_STATE = {
    isLoading: false
}

const loadingReducer = (state=INITIAL_STATE, action) => {
    switch (action.type) {
        case 'TOGGLE_LOADING':
            return {
                ...state,
                isLoading: !state.isLoading
            }
            
    
        default:
            return state
    }
}


export default loadingReducer;