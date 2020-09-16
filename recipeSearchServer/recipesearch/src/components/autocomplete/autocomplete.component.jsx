import React, {useState, Fragment} from 'react';
import {AsyncTypeahead} from 'react-bootstrap-typeahead';
import axios from 'axios';
import {API_URL} from '../../config';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import './autocomplete.styles.css';

const Autocomplete = React.forwardRef(({handleChange, url, placeholder, multiple, allowNew}, ref) => {
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const handleSearch = (query) => {
        setIsLoading(true)
        axios.post(`${API_URL}${url}`, {
            searchQuery: Array.isArray(query)?query[query.length-1].toLowerCase(): query.toLowerCase()
        })
        .then(response => {
            const data = response.data.map(line => url==='titleoptions'?line.title:line.name)
            setOptions(data)
            setIsLoading(false)
            console.log(response.data)
        })
        .catch(err => console.log(err))
        

    }

    const onInputChange = (text, event) => {
        handleChange(text)
        if (text.length>3){
            handleSearch(text)
        }
    }

    const onChange = (text, event) => {
        if (multiple) {
        handleChange(text)
        } else {
            handleChange(text[0])
        }
        if (text.length>3){
            handleSearch(text)
        }
    }


    return (
        <Fragment>
                <AsyncTypeahead 
                ref={ref}
                allowNew={allowNew}
                newSelectionPrefix='Ваш ингредиент: '
                flip
                clearButton
                multiple={multiple}
                id="titleSearch"
                isLoading={isLoading}
                labelKey="title"
                minLength={3}
                onSearch={handleSearch}
                onChange={onChange}
                onInputChange={multiple?null:onInputChange}
                options={options}
                placeholder={placeholder}
                />
        </Fragment>
    )
})


export default Autocomplete;