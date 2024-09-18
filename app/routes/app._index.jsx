import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

import styles from "./styles.css?url";
import { CustomerList } from "../components/CustomerList";

const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // const response2 = await admin.graphql(
  //   `#graphql
  //   query {
  //     customers(first : 250) {
  //       edges {
  //         node {
  //           id,
  //           note,
  //           firstName,
  //           email,
  //           metafield(namespace: "custom", key: "test_status") {
  //             value
  //           },
  //           updatedAt
  //         }
  //       }
  //     }
  //   }`,
  // );

  // const response3 = await admin.graphql(
  //   `#graphql
  //     query {
  //       orders(first:100) {
  //         nodes {
  //           id
  //           name
  //           displayFulfillmentStatus
  //         }
  //       }
  //     }`,
  // );

  let allOrders = [];
  let hasNextOrderPage = true;
  let endOrderCursor = null;

  while (hasNextOrderPage) {
    const response4 = await admin.graphql(
      `#graphql
        query($first: Int!, $after: String) {
          orders(first: $first, after: $after) {
            nodes {
              id
              name
              createdAt
              updatedAt
              customer {
                id
                firstName
                email
                metafields(first: 12) {
                  edges {
                    node {
                      id
                      namespace
                      key
                      value
                    }
                  }
                }
              }
              email
              displayFulfillmentStatus
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
          after: endOrderCursor,
        },
      },
    );
    let response4_data = await response4.json();

    allOrders = allOrders.concat(response4_data.data.orders.nodes);
    hasNextOrderPage = response4_data.data.orders.pageInfo?.hasNextPage;
    endOrderCursor = response4_data.data.orders.pageInfo.endCursor;
  }

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
      },
    );

    let response_data = await response.json();
    allCustomers = allCustomers.concat(response_data.data.customers.edges);
    hasNextPage = response_data.data.customers.pageInfo.hasNextPage;
    endCursor = response_data.data.customers.pageInfo.endCursor;
  }

  console.log("orders?.nodes", allOrders, allOrders.length);

  const sortedCustomers = allCustomers.sort((a, b) => {
    return new Date(b.node.updatedAt) - new Date(a.node.updatedAt);
  });

  return {
    customers: sortedCustomers,
    orders: allOrders,
    process: json({ ENV: { VARIABLE: process.env.VARIABLE } }),
  };
};

export const links = () => [{ rel: "stylesheet", href: styles }];

let firstLoad = true;
const customerCountPerPage = 100;

export default function Customers() {
  const [searchParams, setSearchParams] = useState("");
  const [pageInfo, setPageInfo] = useState(1);

  let { customers, process, orders } = useLoaderData() || [];

  // function setPriorityRows (value , array) {
  //   const rows = value === '' ? array.filter(({node} = customer) => {
  //     if(node?.metafield && (node?.metafield.value.toLowerCase() === 'updated' || node?.metafield.value.toLowerCase() === 'new')){
  //       return node
  //     }
  //     return false

  //   }).map(({node} = customer) =>{
  //     return [
  //       <Link
  //         to={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
  //         // target={"_blank"}
  //       >
  //         {node.firstName}
  //       </Link>,
  //       node.id.replace('gid://shopify/Customer/', ''),
  //       node.email,
  //       node.metafield.value
  //       // node.note !== "" || !node.note ? "Passed" : "-"
  //     ]
  //   }): (
  //     array.filter(({node} = customer) => {
  //       const lowerCasedFirstName = node.firstName.toLowerCase();
  //       const lowerCasedIntup = value.toLowerCase();
  //       const lowerCasedEmail = node.email.toLowerCase();
  //       if(node?.metafield && (node?.metafield.value.toLowerCase() === 'updated' || node?.metafield.value.toLowerCase() === 'new')){
  //         if(lowerCasedFirstName.includes(lowerCasedIntup)){
  //           return node
  //         }
  //         if(lowerCasedEmail.includes(lowerCasedIntup)){
  //           return node
  //         }
  //       }
  //       return false
  //     }).map(({node} = customer) =>{
  //       return [
  //         <Link
  //           to={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
  //           // url={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
  //           // target={"_blank"}
  //         >
  //           {node.firstName}
  //         </Link>,
  //         node.id.replace('gid://shopify/Customer/', ''),
  //         node.email,
  //         node.note !== "" || !node.note ? "Passed" : "-"
  //       ]
  //     })
  //   )

  //   if(rows.length === 0){
  //     rows.push(['Empty','-','-','-'])
  //   }
  //   return rows
  // }

  // function setAllCustomersRows(value,array){
  //   const rows = value === '' ? array.map(({node} = customer) =>{
  //     return [
  //       <Link
  //         to={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
  //       >
  //         {node.firstName}
  //       </Link>,
  //       node.id.replace('gid://shopify/Customer/', ''),
  //       node.email,
  //       node.note !== "" && node.note ? "Passed" : "-" ,

  //     ]
  //   }): (
  //     array.filter(({node} = customer) => {
  //       const lowerCasedFirstName = node.firstName.toLowerCase();
  //       const lowerCasedIntup = value.toLowerCase();
  //       const lowerCasedEmail = node.email.toLowerCase();
  //       if(lowerCasedFirstName.includes(lowerCasedIntup)){
  //         return node
  //       }
  //       if(lowerCasedEmail.includes(lowerCasedIntup)){
  //         return node
  //       }
  //       return false
  //     }).map(({node} = customer) =>{
  //       return [
  //         <Link
  //           url={`/app/customer/${node.id.replace('gid://shopify/Customer/', '')}`}
  //           // target={"_blank"}
  //         >
  //           {node.firstName}
  //         </Link>,
  //         node.id.replace('gid://shopify/Customer/', ''),
  //         node.email,
  //         node.note !== "" && node.note ? "Passed" : "-"
  //       ]
  //     })
  //   )

  //   if(rows.length === 0){
  //     rows.push(['Empty','-','-','-'])
  //   }
  //   return rows
  // }

  function setMergedTable(value = "", array = []) {
    let rows = [];

    const allCustomers = array.map(({ node } = customer) => {
      return [
        node.firstName,
        node.id.replace("gid://shopify/Customer/", ""),
        node.email,
        node.note !== "" && node.note ? "Passed" : "-",
        node?.metafield &&
        (node?.metafield.value.toLowerCase() === "updated" ||
          node?.metafield.value.toLowerCase() === "new")
          ? node?.metafield.value
          : node.note !== "" && node.note
            ? "Success"
            : "-",
        node.updatedAt,
      ];
    });

    let newCustomers = [];
    let successCustomers = [];

    allCustomers.forEach((_customer) => {
      const aMetafield = _customer[4];

      if (
        aMetafield.toLowerCase() === "new" ||
        aMetafield.toLowerCase() === "updated"
      ) {
        newCustomers.push(_customer);
      } else {
        successCustomers.push(_customer);
      }
    });

    newCustomers = newCustomers.sort((a, b) => {
      const aUpdatedAt = new Date(a[5]);
      const bUpdatedAt = new Date(b[5]);

      return bUpdatedAt <= aUpdatedAt; // Descending order
    });

    successCustomers = successCustomers.sort((a, b) => {
      const aUpdatedAt = new Date(a[5]).getTime();
      const bUpdatedAt = new Date(b[5]).getTime();

      return bUpdatedAt <= aUpdatedAt; // Descending order
    });

    const sortedCustomers = [].concat(successCustomers).concat(newCustomers);

    rows = sortedCustomers.map((customer) => {
      return [
        <Link to={`/app/customer/${customer[1]}`}>{customer[0]}</Link>,
        <Link to={`/app/customer/${customer[1]}`}>{customer[1]}</Link>,
        customer[2],
        customer[3],
        customer[4],
      ];
    });

    if (value.length > 0) {
      rows = sortedCustomers
        .filter((customer) => {
          const lowerCasedFirstName = customer[0]
            ? customer[0].toLowerCase()
            : "";
          const lowerCasedIntup = value.toLowerCase();
          const lowerCasedEmail = customer[2] ? customer[2].toLowerCase() : "";
          if (lowerCasedFirstName.includes(lowerCasedIntup)) {
            return customer;
          }
          if (lowerCasedEmail.includes(lowerCasedIntup)) {
            return customer;
          }
          return false;
        })
        .map((customer) => {
          return [
            <Link to={`/app/customer/${customer[1]}`}>{customer[0]}</Link>,
            <Link to={`/app/customer/${customer[1]}`}>{customer[1]}</Link>,
            customer[2],
            customer[3],
            customer[4],
          ];
        });
    }

    return rows;
  }

  function setMergedTable2(value = "", array = []) {
    let rows = [];
    // console.log("asda", array);

    // return rows;

    const allCustomers = array.map(
      ({
        customer,
        id,
        displayFulfillmentStatus,
        name,
        createdAt,
        metafields,
      }) => {
        return [
          customer.firstName,
          customer.id.replace("gid://shopify/Customer/", ""),
          customer.email,
          customer.note !== "" && customer.note ? "Passed" : "-",
          customer?.metafield &&
          (customer?.metafield.value.toLowerCase() === "updated" ||
            customer?.metafield.value.toLowerCase() === "new")
            ? customer?.metafield.value
            : customer.note !== "" && customer.note
              ? "Success"
              : "-",
          customer.updatedAt,
          id,
          displayFulfillmentStatus,
          createdAt,
          name,
          customer.metafields.edges,
        ];
      },
    );

    let newCustomers = [];
    let successCustomers = [];

    allCustomers.forEach((_customer) => {
      const aMetafield = _customer[4];

      if (
        aMetafield.toLowerCase() === "new" ||
        aMetafield.toLowerCase() === "updated"
      ) {
        newCustomers.push(_customer);
      } else {
        successCustomers.push(_customer);
      }
    });

    newCustomers = newCustomers.sort((a, b) => {
      const aUpdatedAt = new Date(a[5]);
      const bUpdatedAt = new Date(b[5]);

      return bUpdatedAt <= aUpdatedAt; // Descending order
    });

    successCustomers = successCustomers.sort((a, b) => {
      const aUpdatedAt = new Date(a[5]).getTime();
      const bUpdatedAt = new Date(b[5]).getTime();

      return bUpdatedAt <= aUpdatedAt; // Descending order
    });

    const sortedCustomers = [].concat(successCustomers).concat(newCustomers);

    rows = allCustomers.map((customer) => {
      console.log(customer);
      return [
        <Link
          to={`/app/customer-plan-b/${customer[1]}/${customer[6].replace("gid://shopify/Order/", "")}`}
        >
          {customer[0]}
        </Link>,
        // <Link to={`/app/customer/${customer[1]}`}>
        customer[1],
        // </Link>,
        // customer[6].replace("gid://shopify/Order/", ""),
        customer[9],
        customer[2],
        // customer[3],
        // customer[4],
        customer[7],
        customer[8].split("T")[0].replaceAll("-", "."),
        // .replace("T", " ").replace("Z", ""),
      ];
    });

    if (value.length > 0) {
      rows = allCustomers
        .filter((customer) => {
          const lowerCasedFirstName = customer[0]
            ? customer[0].toLowerCase()
            : "";
          const lowerCasedIntup = value.toLowerCase();
          const lowerCasedEmail = customer[2] ? customer[2].toLowerCase() : "";
          if (customer[1].toString().includes(lowerCasedIntup)) {
            return customer;
          }
          if (customer[9].toString().includes(lowerCasedIntup)) {
            return customer;
          }
          if (lowerCasedFirstName.includes(lowerCasedIntup)) {
            return customer;
          }
          if (lowerCasedEmail.includes(lowerCasedIntup)) {
            return customer;
          }
          return false;
        })
        .map((customer) => {
          return [
            <Link
              to={`/app/customer-plan-b/${customer[1]}/${customer[6].replace("gid://shopify/Order/", "")}`}
            >
              {customer[0]}
            </Link>,
            ,
            customer[1],
            // <Link to={`/app/customer/${customer[1]}`}>{customer[1]}</Link>,
            // customer[6].replace("gid://shopify/Order/", ""),
            customer[9],
            customer[2],
            // customer[3],
            // customer[4],
            customer[7],
            customer[8].split("T")[0].replaceAll("-", "."),
            // .replace("T", " ").replace("Z", ""),
          ];
        });
    }

    return rows;
  }

  function setUrlParam(key, value) {
    // Get current URL
    const url = new URL(window.location);

    // Set the new parameter
    url.searchParams.set(key, value);

    // Update the browser's address bar without reloading the page
    window.history.replaceState({}, "", url);
  }

  useEffect(() => {
    const queryParameters = new URLSearchParams(
      window ? window.location.search : null,
    );
    const q = queryParameters.get("q");
    const page = queryParameters.get("page");
    if (!firstLoad && q !== searchParams) {
      setUrlParam("q", searchParams || "");
    }
    if (!firstLoad && pageInfo !== page) {
      setUrlParam("page", pageInfo || 1);
    }
    if (firstLoad && q !== "") {
      setSearchParams(q);
    }
    if (firstLoad && page !== 0) {
      setPageInfo(Number(page));
    }
    firstLoad = false;
  }, [searchParams, pageInfo]);

  useEffect(() => {
    setPageInfo(Number(1));
  }, [searchParams]);

  return (
    <Page>
      <TitleBar title="Customers"></TitleBar>
      <main className="main">
        <CustomerList
          callback={setMergedTable2}
          customers={orders}
          title="All orders"
          setSearchParams={setSearchParams}
          increasePage={() => setPageInfo((prev) => prev + 1)}
          pageInfo={pageInfo}
          setPageInfo={setPageInfo}
          decreasePage={() => setPageInfo((prev) => prev - 1)}
          customerCountPerPage={customerCountPerPage}
          headings={[
            "Customer name",
            "Customer ID",
            "Order ID",
            "E-mail",
            // "Quiz is passed",
            // "Status (Updated / New)",
            "Fulfillment Status",
            "Created at",
          ]}
        />
        {/* <CustomerList
          callback={setMergedTable}
          customers={customers}
          title="All customers"
          setSearchParams={setSearchParams}
          increasePage={() => setPageInfo((prev) => prev + 1)}
          pageInfo={pageInfo}
          setPageInfo={setPageInfo}
          decreasePage={() => setPageInfo((prev) => prev - 1)}
          customerCountPerPage={customerCountPerPage}
          headings={[
            "Customer name",
            "ID",
            "E-mail",
            "Quiz is passed",
            "Status (Updated / New)",
          ]}
        /> */}
      </main>
    </Page>
  );
}
