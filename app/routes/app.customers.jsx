import { useCallback, useEffect, useMemo, useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  BlockStack,
  Link,
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
  

  const response = await admin.graphql(
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
            }
          }
        }
      }
    }`,
  );

  const {data} = await response.json();

  return {
    customers : data.customers.edges,
    process: json({ ENV: { VARIABLE: process.env.VARIABLE } })

  }

};

export const links = () => [
  { rel: "stylesheet", href: styles },
];


export default function Customers() {

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
          url={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
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
            url={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
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
          url={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
          // target={"_blank"}
        >
          {node.firstName}
        </Link>,
        node.id.replace('gid://shopify/Customer/', ''),
        node.email,
        node.note !== "" && node.note ? "Passed" : "-" 
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


  return (

    <Page>
      <TitleBar title="Customers">
      </TitleBar>
      <main className="main">
        <CustomerList
          callback = {setPriorityRows}
          customers = {customers}
          title = "Priority list"
          headings = {[
            'Customer name',
            'ID',
            'E-mail',
            'Status (Updated / New)'
          ]}
        />
        <CustomerList
          callback = {setAllCustomersRows}
          customers = {customers}
          title = "All customers"
          headings = {[
            'Customer name',
            'ID',
            'E-mail',
            'Passed test status'
          ]}
        />
      </main>
    </Page>
  );
}
