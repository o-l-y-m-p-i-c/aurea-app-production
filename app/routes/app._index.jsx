import { useCallback, useEffect, useMemo, useState } from "react";
import { json } from "@remix-run/node";
import { Link, useActionData, useLoaderData, useNavigate, useNavigation, useParams, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  BlockStack,
  LegacyCard,
  DataTable,
  Autocomplete, Icon,
} from "@shopify/polaris";
import {SearchIcon} from '@shopify/polaris-icons';
import { TitleBar} from "@shopify/app-bridge-react";
import {  authenticate } from "../shopify.server";

import styles from "./styles.css?url"
import { Input } from "../components/Input";
import { CustomerList } from "../components/CustomerList";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  

  const response2 = await admin.graphql(
    `#graphql
    query {
      customers(first : 250) {
        edges {
          node {
            id,
            note,
            firstName,
            email,
            metafield(namespace: "custom", key: "test_status") {
              value
            },
            updatedAt
          }
        }
      }
    }`,
  );

  const {data} = await response2.json();


  // ----------------------------------------------------------------


  let allCustomers = [];
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {
    const response = await admin.graphql(
      `#graphql
      query($first: Int!, $after: String) {
        customers(first: $first, after: $after) {
          edges {
            node {
              id
              note
              firstName
              email
              metafield(namespace: "custom", key: "test_status") {
                value
              }
              updatedAt
            }
          }
          pageInfo {
            hasPreviousPage
            hasNextPage
            endCursor
            startCursor
          }
        }
      }`,
      {
        variables: {
          first: 250,
          after: endCursor,
        },
      }
    );

    let hhh = await response.json();
    allCustomers = allCustomers.concat(hhh.data.customers.edges);
    hasNextPage = hhh.data.customers.pageInfo.hasNextPage;
    endCursor = hhh.data.customers.pageInfo.endCursor;
  }

  return {
    customers : allCustomers,
    process: json({ ENV: { VARIABLE: process.env.VARIABLE } })

  }

};

export const links = () => [
  { rel: "stylesheet", href: styles },
];

let firstLoad = true;
const customerCountPerPage = 100


export default function Customers() {
 

  const [searchParams, setSearchParams] = useState('')
  const [pageInfo, setPageInfo] = useState(1)


  const {customers, process} = useLoaderData() || []

  function setPriorityRows (value , array) {
    const rows = value === '' ? array.filter(({node} = customer) => {
      if(node?.metafield && (node?.metafield.value.toLowerCase() === 'updated' || node?.metafield.value.toLowerCase() === 'new')){
        return node
      }
      return false

    }).map(({node} = customer) =>{
      return [
        <Link
          to={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
          // target={"_blank"}
        >
          {node.firstName}
        </Link>,
        node.id.replace('gid://shopify/Customer/', ''),
        node.email,
        node.metafield.value
        // node.note !== "" || !node.note ? "Passed" : "-" 
      ]
    }): (
      array.filter(({node} = customer) => {
        const lowerCasedFirstName = node.firstName.toLowerCase();
        const lowerCasedIntup = value.toLowerCase();
        const lowerCasedEmail = node.email.toLowerCase();
        if(node?.metafield && (node?.metafield.value.toLowerCase() === 'updated' || node?.metafield.value.toLowerCase() === 'new')){
          if(lowerCasedFirstName.includes(lowerCasedIntup)){
            return node
          }
          if(lowerCasedEmail.includes(lowerCasedIntup)){
            return node
          }
        }
        return false
      }).map(({node} = customer) =>{
        return [
          <Link
            to={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
            // url={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
            // target={"_blank"}
          >
            {node.firstName}
          </Link>,
          node.id.replace('gid://shopify/Customer/', ''),
          node.email,
          node.note !== "" || !node.note ? "Passed" : "-" 
        ]
      })
    )

    if(rows.length === 0){
      rows.push(['Empty','-','-','-'])
    }
    return rows
  }

  function setAllCustomersRows(value,array){
    const rows = value === '' ? array.map(({node} = customer) =>{
      return [
        <Link
          to={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
        >
          {node.firstName}
        </Link>,
        node.id.replace('gid://shopify/Customer/', ''),
        node.email,
        node.note !== "" && node.note ? "Passed" : "-" ,
        
      ]
    }): (
      array.filter(({node} = customer) => {
        const lowerCasedFirstName = node.firstName.toLowerCase();
        const lowerCasedIntup = value.toLowerCase();
        const lowerCasedEmail = node.email.toLowerCase();
        if(lowerCasedFirstName.includes(lowerCasedIntup)){
          return node
        }
        if(lowerCasedEmail.includes(lowerCasedIntup)){
          return node
        }
        return false
      }).map(({node} = customer) =>{
        return [
          <Link
            url={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
            // target={"_blank"}
          >
            {node.firstName}
          </Link>,
          node.id.replace('gid://shopify/Customer/', ''),
          node.email,
          node.note !== "" && node.note ? "Passed" : "-" 
        ]
      })
    )

    if(rows.length === 0){
      rows.push(['Empty','-','-','-'])
    }
    return rows
  }

  function setMergedTable(value = '',array = []){
    let rows = []

    const allCustomers = array.map(({node} = customer) =>{
      return [
        node.firstName,
        node.id.replace('gid://shopify/Customer/', ''),
        node.email,
        node.note !== "" && node.note ? "Passed" : "-" ,
        node?.metafield && (node?.metafield.value.toLowerCase() === 'updated' || node?.metafield.value.toLowerCase() === 'new') ? node?.metafield.value : (node.note !== "" && node.note) ? 'Success' : '-',
        node.updatedAt
      ]
    })


    let newCustomers = []
    let successCustomers = []

    allCustomers.forEach(_customer => {
      const aMetafield = _customer[4];

      if (aMetafield.toLowerCase() === 'new' || aMetafield.toLowerCase() === 'updated') {
        newCustomers.push(_customer)
      }else{
        successCustomers.push(_customer)
      }
    })


    newCustomers = newCustomers.sort((a, b) => {
      const aUpdatedAt = new Date(a[5]);
      const bUpdatedAt = new Date(b[5]);

      console.log(aUpdatedAt)

      return bUpdatedAt <= aUpdatedAt; // Descending order
    })

    successCustomers = successCustomers.sort((a, b) => {
      const aUpdatedAt = new Date(a[5]).getTime();
      const bUpdatedAt = new Date(b[5]).getTime();

      return bUpdatedAt <= aUpdatedAt;  // Descending order
    })


    const sortedCustomers = [].concat(successCustomers).concat(newCustomers)

    // const sortedCustomers = allCustomers.sort((a, b) => {
    //   const aMetafield = a[4];
    //   const bMetafield = b[4];
      
    //   if (aMetafield.toLowerCase() === 'new' || aMetafield.toLowerCase() === 'updated') {
    //     return 1;
    //   }
    //   if (bMetafield.toLowerCase() === 'new' || bMetafield.toLowerCase() === 'updated') {
    //     return -1;
    //   }
    //   return 0;
    // });

    rows = sortedCustomers.map((customer) => {
      return [
        <Link
          to={`/app/customer/${customer[1]}`}
        >
          {customer[0]}
        </Link>,
        <Link
          to={`/app/customer/${customer[1]}`}
        >
          {customer[1]}
        </Link>,
        customer[2],
        customer[3],
        customer[4],
        // customer[5],  
      ]
    })


    if(value.length > 0){
      rows = sortedCustomers.filter((customer) => {
        const lowerCasedFirstName = customer[0] ? customer[0].toLowerCase() : "";
        const lowerCasedIntup = value.toLowerCase();
        const lowerCasedEmail = customer[2] ? customer[2].toLowerCase() : ""; 
        if(lowerCasedFirstName.includes(lowerCasedIntup)){
          return customer
        }
        if(lowerCasedEmail.includes(lowerCasedIntup)){
          return customer
        }
        return false
      }).map((customer) =>{
        return [
          <Link
            to={`/app/customer/${customer[1]}`}
          >
            {customer[0]}
          </Link>,
           <Link
              to={`/app/customer/${customer[1]}`}
            >
              {customer[1]}
            </Link>,
          customer[2],
          customer[3],
          customer[4] 
        ]
      })
    }


    // rows = 

    return rows
  }

  function setUrlParam(key, value) {
    // Get current URL
    const url = new URL(window.location);

    // Set the new parameter
    url.searchParams.set(key, value);

    // Update the browser's address bar without reloading the page
    window.history.replaceState({}, '', url);
}



  useEffect(()=>{
    const queryParameters = new URLSearchParams(window ? window.location.search : null)
    const q = queryParameters.get("q")
    const page = queryParameters.get("page")
    if(!firstLoad && q !== searchParams){
      setUrlParam("q",searchParams || "")
    }
    if(!firstLoad && pageInfo !== page){
      setUrlParam("page",pageInfo || 1)
    }
    if(firstLoad && q !== ''){
      setSearchParams(q)
    }
    if(firstLoad && page !== 0){
      setPageInfo(Number(page))
    }
    firstLoad = false
  },[searchParams,pageInfo])

  useEffect(()=>{
    setPageInfo(Number(1))
  },[searchParams])


  return (

    <Page>
      <TitleBar title="Customers">
      </TitleBar>
      <main className="main">
        
        {/* <CustomerList
          callback = {setPriorityRows}
          customers = {customers}
          title = "Priority list"
          headings = {[
            'Customer name',
            'ID',
            'E-mail',
            'Status (Updated / New)'
          ]}
        /> */}
        <CustomerList
          callback = {setMergedTable}
          customers = {customers}
          title = "All customers"
          setSearchParams = {setSearchParams}
          increasePage = {() => setPageInfo(prev => prev + 1)}
          pageInfo = {pageInfo}
          setPageInfo = {setPageInfo}
          decreasePage = {() => setPageInfo(prev => prev - 1)}
          customerCountPerPage={customerCountPerPage}
          headings = {[
            'Customer name',
            'ID',
            'E-mail',
            'Quiz is passed',
            'Status (Updated / New)',
            
          ]}
        />
      </main>
    </Page>
  );
}
