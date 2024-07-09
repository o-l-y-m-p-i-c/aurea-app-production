import { Autocomplete, BlockStack, DataTable, Icon, Layout, LegacyCard } from "@shopify/polaris"
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "../Input"
import {SearchIcon} from '@shopify/polaris-icons';
import { useNavigate } from "@remix-run/react";



export const CustomerList = ({
    customers = [] , 
    callback = () => null , 
    title = '',
    headings = [],
    setSearchParams = () => null,
    increasePage = () => null,
    decreasePage = () => null,
    pageInfo = null,
    customerCountPerPage = 0,
    setPageInfo = () => null
}) => {
  

    const deselectedOptions = useMemo(
        () => customers.map(({node}) => {return { 
          value: node.firstName ? node.firstName.toLowerCase() : null,
          label: node.firstName
        }}),
        [],
    );
    
    
      const [selectedOptions, setSelectedOptions] = useState([]);
      const [inputValue, setInputValue] = useState('');
      const [options, setOptions] = useState(deselectedOptions);
    
      const [rowsInPriorityTable, setRowsInPriorityTable] = useState([])
      const [defaultRows, setDefaultRows] = useState([])
    
      const updateText = useCallback(
        (value) => {
          setInputValue(value);
    
          setSearchParams(value)

          if (value === '') {
            setOptions(deselectedOptions);
            return;
          }
    
          const filterRegex = new RegExp(value, 'i');
          const resultOptions = deselectedOptions.filter((option) =>
            option.label.match(filterRegex),
          );
          setOptions(resultOptions);
          
        },
        [deselectedOptions],
      );
    
      const updateSelection = useCallback(
        (selected) => {
          const selectedValue = selected.map((selectedItem) => {
            const matchedOption = options.find((option) => {
              return option.value.match(selectedItem);
            });
            return matchedOption && matchedOption.label;
          });
    
          setSelectedOptions(selected);
          setInputValue(selectedValue[0] || '');
        },
        [options],
      );
    
    
      useEffect(()=>{
        const rows = callback(inputValue, customers)

        if(pageInfo > Math.ceil(rows.length / customerCountPerPage)){
          setPageInfo(1)
        }
        else if(pageInfo < 1){
          setPageInfo(1)
        }else{
          
        }
        setRowsInPriorityTable(()=>rows.slice((pageInfo - 1) * customerCountPerPage, pageInfo * customerCountPerPage))
        setDefaultRows(rows)
  
      },[inputValue,pageInfo])
    
    return <>
        <div className="">
          <h2>
            {title} - ({defaultRows.length})
          </h2>
          <div style={{marginBottom: 20}}>
            <Autocomplete
              options={options}
              selected={selectedOptions}
              onSelect={updateSelection}
              textField={<Input 
                callback={updateText}  
                value={inputValue}
                icon={<Icon source={SearchIcon} tone="base" />}
                placeholder="Search"
              />}
            />
          </div>
          <BlockStack gap="500">
            <Layout>
              <Layout.Section>
              <LegacyCard>
                <div className="tableWrap" style={{'--column-count':headings.length}}>
                  <DataTable
                    stickyHeader={true}
                    columnContentTypes={[
                      ...headings.map(() => 'text')
                      // 'text',
                      // 'text',
                      // 'text',
                      // 'text',
                      // 'text'
                    ]}
                    headings={[ ...headings.map(heading => {return <b>{heading}</b>})]}
                    rows={[...rowsInPriorityTable].reverse()}
                  />
                </div>
              </LegacyCard>
              </Layout.Section>
            </Layout>
          </BlockStack> 
        </div>
        <div className="pagination" >
          <button className="back-btn pagination-btn"  disabled={pageInfo <= 1} onClick={1 < pageInfo && decreasePage}>
            -
          </button>
          <span className="pagination-value">
            {pageInfo.toString()} / {Math.ceil(defaultRows.length / customerCountPerPage) || 1}
          </span>
          <button className="next-btn pagination-btn"  disabled={((customerCountPerPage * pageInfo) / defaultRows.length) >= 1} onClick={((customerCountPerPage * pageInfo) / defaultRows.length) < 1 && increasePage}>
            +
          </button>
        </div>
    
    </>
}