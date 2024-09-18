import {
  Link,
  useActionData,
  useLoaderData,
  useParams,
  useSubmit,
} from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  BlockStack,
  Card,
  DatePicker,
  Layout,
  Page,
  Text,
} from "@shopify/polaris";
import html2canvas from "html2canvas";
import { json } from "@remix-run/node";
// import jsPDF from "jspdf";
import _ from "lodash";
import { useCallback, useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
// import ReactToPrint from 'react-to-print';  // Import default

// import PrintableComponent from "../components/PrintableComponent";
import { authenticate } from "../shopify.server";

import * as pkg from "react-to-pdf";
// import generatePDF from 'react-to-pdf';

import styles from "./styles.css?url";

const recepiesBtns = [
  {
    title: "-",
  },
  {
    title: "Min",
  },
  {
    title: "Med",
  },
  {
    title: "Max",
  },
];

let defaultRecepies = [
  {
    id: "",
    title: "B6 Р5Р",
    key: "b6_5_",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    ingredientName: "Vitamin B6",
    nrv: 1.4,
    min: 1.4,
    med: 1.6,
    max: 4,
    unit: "mg",
  },
  {
    id: "",
    title: "B9 Folic Acid",
    key: "b9_folic_acid",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    ingredientName: "Vitamin B9",
    nrv: 200,
    min: 100,
    med: 200,
    max: 400,
    unit: "μg",
  },
  {
    id: "",
    title: "B12 Methylcobalamine",
    key: "b12_methylcobalamine",
    ingredientName: "Vitamin B12",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    nrv: 2.5,
    min: 5,
    med: 25,
    max: 100,
    unit: "μg",
  },
  {
    id: "",
    title: "Vitamin C Ascorbic Acid",
    ingredientName: "Vitamin C",
    key: "vitamin_c_ascorbic_acid",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    nrv: 80,
    min: 20,
    med: 40,
    max: 80,
    unit: "mg",
  },
  {
    id: "",
    title: "Vitamin D3 Cholecalciferol",
    key: "vitamin_d3_cholecalciferol",
    ingredientName: "Vitamin D",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    nrv: 5,
    min: 10,
    med: 15,
    max: 20,
    unit: "μg",
  },
  {
    id: "",
    title: "Calcium Carbonate",
    ingredientName: "Calcium Carbonate",
    key: "calcium_carbonate",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    nrv: 800,
    min: 0,
    med: 150,
    max: 500,
    unit: "mg",
  },
  {
    id: "",
    title: "Iron Bisglycinate",
    key: "iron_bisglycinate",
    ingredientName: "Iron Bisglycinate",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    nrv: 14,
    min: 5,
    med: 10,
    max: 14,
    unit: "mg",
  },
  {
    id: "",
    title: "Magnesium Bisglycinate",
    key: "magnesium_bisglycinate",
    ingredientName: "Magnesium Bisglycinate",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    nrv: 375,
    min: 57,
    med: 75,
    max: 100,
    unit: "mg",
  },
  {
    id: "",
    title: "Selenomethionine",
    key: "selenomethionine",
    ingredientName: "Selenmethionine",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    nrv: 55,
    min: 0,
    med: 0,
    max: 55,
    unit: "μg",
  },
  {
    id: "",
    title: "Zinc Bisglycinate",
    key: "zinc_bisglycinate",
    ingredientName: "Zinc Bisglycinate",
    btns: recepiesBtns,
    chosenVariant: "-",
    namespace: "custom",
    nrv: 10,
    min: 5,
    med: 10,
    max: 15,
    unit: "mg",
  },
];

const updateCustomerMetafields = async (metafields, id, admin) => {
  // customer mutation
  const response = await admin.graphql(
    `#graphql
    mutation updateCustomerMetafields($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
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
        userErrors {
          message
          field
        }
      }
    }`,
    {
      variables: {
        input: {
          metafields: metafields,
          id: id,
        },
      },
    },
  );

  // const response = await admin.graphql(
  //   `#graphql
  //   mutation updateOrderMetafields($input: OrderInput!) {
  //     orderUpdate(input: $input) {
  //       order {
  //         id
  //         metafields(first: 12) {
  //           edges {
  //             node {
  //               id
  //               namespace
  //               key
  //               value
  //             }
  //           }
  //         }
  //       }
  //       userErrors {
  //         message
  //         field
  //       }
  //     }
  //   }`,
  //   {
  //     variables: {
  //       input: {
  //         metafields: metafields,
  //         id: id,
  //       },
  //     },
  //   },
  // );

  const data = await response.json();
  // const data2 = await response.json();
  console.log("data", data.data);
  return data;
};

export const links = () => [{ rel: "stylesheet", href: styles }];

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const path = url.pathname;
  let id = path.split("/");
  const orderId = id[id.length - 1];
  id = id[id.length - 2];

  // console.log('Current path:', id);

  const response = await admin.graphql(
    `#graphql
    query {
        customer(id: "gid://shopify/Customer/${id}") {
        id
        firstName
        lastName
        email
        phone
        createdAt
        updatedAt
        note
        verifiedEmail
        validEmailAddress
        tags
        metafields(first: 250, namespace: "custom") {
            edges {
              node {
                namespace
                id
                description
                value
                key
              }
            }
          }
        lifetimeDuration
        addresses {
            address1
        }
        image {
            src
        }
        canDelete
        }
    }`,
  );

  const response2 = await admin.graphql(`#graphql
    query {
        order1: order(id: "gid://shopify/Order/${orderId}") {
            id
      name
      createdAt
      updatedAt
      customer {
        id
        firstName
        lastName
        email
        phone
      }
      email
      phone
      displayFulfillmentStatus
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      subtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalRefundedSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      lineItems(first: 100) {
        edges {
          node {
            id
            title
            quantity
            
            totalDiscountSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
      shippingAddress {
        address1
        address2
        city
        province
        country
        zip
      }
      billingAddress {
        address1
        address2
        city
        province
        country
        zip
      }
      fulfillments {
        id
        status
        trackingInfo {
          number
          url
        }
        createdAt
        updatedAt
      }
      transactions {
        id
        amountSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        gateway
        status
        createdAt
      }
        }
  }`);

  const response3 = await fetch(
    `https://e7098f-02.myshopify.com/admin/api/2024-04/orders/${orderId}.json`,
    {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_API_TOKEN,
        "Content-Type": "application/json",
      },
    },
  );

  const { data } = await response.json();

  const orderInfo = await response2.json();

  const orderInfo2 = await response3.json();

  const orderData = orderInfo.data;

  return {
    data,
    order: orderData?.order1,
    id,
    order2: orderInfo2.order,
    process: json({
      ENV: { SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET },
    }),
  };
};

const defaultMetafield = {
  namespace: null,
  key: null,
  type: "single_line_text_field", // Assuming all are single line text fields
  value: null,
  ownerId: null,
};

// const metafieldsKeys = [
//   "test_status",
//   "b6_5_",
//   "b9_folic_acid",
//   "b12_methylcobalamine",
//   "vitamin_c_ascorbic_acid",

// ]
const metafieldsNamespace = "custom";
const metafieldsDefaultValue = "-";

const createMetafield = ({ namespace, key, value, ownerId }) => {
  return {
    namespace,
    key,
    type: "single_line_text_field", // Assuming all are single line text fields
    value: value || "-",
    ownerId: ownerId,
  };
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const { admin } = await authenticate.admin(request);
  const form_length = [...formData].length - 1 / 3;
  const customerID = formData.get("customerID");
  // const orderID = formData.get("orderID");
  const metafields = [];

  const existingMetafieldsResponse = await admin.graphql(
    `#graphql
    query {
      customer(id: "${customerID}") {
        metafields(first: 250, namespace: "custom") {
          edges {
            node {
              id
              key
              value
              namespace
            }
          }
        }
      }
    }`,
  );

  // const existingOrderMetafieldsResponse = await admin.graphql(
  //   `#graphql
  //   query {
  //     order1: order(id: "gid://shopify/Order/${orderID}") {
  //       metafields(first: 250, namespace: "custom") {
  //         edges {
  //           node {
  //             id
  //             key
  //             value
  //             namespace
  //           }
  //         }
  //       }
  //     }
  //   }`,
  // );

  const data = await existingMetafieldsResponse.json();
  // const orderData = await existingOrderMetafieldsResponse.json();

  // console.log(
  //   "existingMetafieldsResponse",
  //   orderData.data.order1.metafields.edges,
  // );

  const existingMetafields = data.data.customer.metafields.edges.map(
    (edge) => edge.node,
  );

  // const existingOrderMetafields = orderData.data.order1.metafields.edges.map(
  //   (edge) => edge.node,
  // );

  for (let i = 0; i < form_length - 1; i++) {
    const namespace = formData.get(`namespace${i}`);
    const key = formData.get(`key${i}`);
    const value = formData.get(`value${i}`);
    if (i === 0 && namespace && key && value) {
      const existingMetafield = existingMetafields.find(
        (metafield) => metafield.key === "test_status",
      );

      if (existingMetafield) {
        metafields.push({
          ...existingMetafield,
          value: "success",
          // ownerId: customerID,
        });
      } else {
        metafields.push({
          namespace: "custom",
          key: "test_status",
          // type: "single_line_text_field", // Assuming all are single line text fields
          value: "success",
          // ownerId: customerID,
        });
      }
    }
    if (namespace && key && value) {
      const existingMetafield = existingMetafields.find(
        (metafield) => metafield.key === key,
      );

      if (existingMetafield) {
        metafields.push({
          ...existingMetafield,
          value: value || "-",
        });
      } else {
        metafields.push({
          // id: "gid://shopify/Metafield/147379043467593",
          namespace: "custom",
          key,
          // type: "single_line_text_field", // Assuming all are single line text fields
          value: value || "-",
          // ownerId: customerID,
        });
      }
    }
  }

  // if (metafields.length === 0) {
  //   for (let i = 0; i < defaultRecepies.length; i++) {
  //     const defaultRecepie = defaultRecepies[i];
  //     const form_key = formData.get(`key${i}`);
  //     const namespace = formData.get(`namespace${i}`);
  //     const value = formData.get(`value${i}`);
  //     const { key } = defaultRecepie
  //     if (i === 0 && namespace && form_key && value) {
  //       metafields.push({
  //         namespace,
  //         key: "test_status",
  //         type: "single_line_text_field", // Assuming all are single line text fields
  //         value: "success",
  //         ownerId: customerID,
  //       });
  //     }
  //     if (namespace && key && value) {
  //       metafields.push({
  //         namespace,
  //         key,
  //         type: "single_line_text_field", // Assuming all are single line text fields
  //         value,
  //         ownerId: customerID,
  //       });
  //     }

  //   }
  // }

  console.log("metafields", metafields);

  try {
    await updateCustomerMetafields(metafields, customerID, admin);
    return "ok";
  } catch (error) {
    return "bad";
  }
};

let options = "";

export default function UserPage() {
  const param = useParams();
  const loadedData = useLoaderData();

  const imageRef = useRef(null);
  const canvasWrap = useRef(null);
  const downloadBtnRef = useRef(null);
  const componentRef = useRef(null);
  const formRef = useRef(null);
  const submitRef = useRef(null);
  const actionData = useActionData();
  const submit = useSubmit();

  const [recepiesIsEditable, setRecepiesEdit] = useState(true);

  const [textareaValue, setTextareaValue] = useState("");

  const [rangeValue, setRangeValue] = useState(40);

  const [isOldVersion, setIsOldVersion] = useState(false);

  const {
    data: { customer },
    id,
    order2,
  } = loadedData;

  console.log("customerInfo", customer);

  const { note } = customer;

  const { metafields = [] } = customer;

  const parsedMetafields = metafields.edges;

  let parsedNotes = [];

  function isJSON(value) {
    try {
      const result = JSON.parse(value);
      return result;
    } catch (error) {
      return false;
    }
  }

  if (note) {
    parsedNotes = JSON.parse(note.trim()) || [];
    if (parsedNotes.length) {
      parsedNotes = parsedNotes.map((parsedNote) => {
        const ansrewValues = isJSON(parsedNote.answerValues) || false;

        // JSON.parse(parsedNote.asnerwValues)

        if (ansrewValues) {
          return {
            ...parsedNote,
            asnerwValues: [...ansrewValues],
            // [...ansrewValues]
          };
        } else {
          return {
            ...parsedNote,
            asnerwValues: [],
            // ansrewValues
            // [...ansrewValues]
          };
        }
      });
    }
    // console.log(parsedNotes)
  }

  const now = new Date();
  const nowday = now.getDay();
  const f_y_day_after = nowday + 40;

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  // today.getDate();
  const month2 = String(today.getMonth() + 1).padStart(2, "0");
  // today.getMonth() + 1; // Months are zero-indexed
  const year2 = today.getFullYear();

  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 40);

  const futureDay = String(futureDate.getDate()).padStart(2, "0");
  // futureDate.getDate();
  const futureMonth = String(futureDate.getMonth() + 1).padStart(2, "0");
  // futureDate.getMonth() + 1; // Months are zero-indexed
  const futureYear = futureDate.getFullYear();

  const [{ month, year }, setDate] = useState({
    month: Number(today.getMonth()),
    year: year2,
  });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(),
    end: new Date(),
  });

  // const parsedNotes = JSON.parse(note.trim()) || []

  const questions = [
    {
      question: "How often do you eat milk products?",
      anserws: ["Never", "Sometimes", "Daily"],
    },
    {
      question: "How often do you eat milk products?",
      anserws: ["Never", "Sometimes", "Daily"],
    },
  ];

  const [recepies, setRecepies] = useState([]);

  const [prevRecepies, setPrevRecepies] = useState([]);

  useEffect(() => {
    const arr = _.cloneDeep(defaultRecepies).map((recepie) => {
      [...parsedMetafields].forEach((element) => {
        const metafield = element.node;
        if (recepie.key === metafield.key) {
          recepie.chosenVariant = metafield.value;
          recepie.namespace = metafield.namespace;
        }
      });

      return recepie;
    });
    setRecepies(arr);
    setPrevRecepies(_.cloneDeep(arr));
  }, []);

  const handleEditRecepies = () => {
    setRecepiesEdit((prev) => !prev);
    if (prevRecepies.length) {
      setRecepies(_.cloneDeep(prevRecepies));
    }
  };

  const changeRecepiesChosenValue = (arg = 1, key) => {
    const updatedRecepies = recepies.map((recepie) => {
      if (key !== recepie.key) return recepie;

      let variant = -1;

      recepie.btns.find((btn, index) => {
        if (btn.title === recepie.chosenVariant) {
          variant = index;
        }
      });

      if (arg == -1 && variant > 0) {
        recepie.chosenVariant = recepie.btns[variant + arg].title;
      }
      if (arg == 1 && variant < recepie.btns.length - 1) {
        recepie.chosenVariant = recepie.btns[variant + arg].title;
      }

      return { ...recepie };
    });

    setRecepies(updatedRecepies);
  };

  const changeRecepiesChosenValueBtnClick = (arg = 0, key) => {
    if (recepiesIsEditable) {
      return;
    }

    const updatedRecepies = recepies.map((recepie) => {
      if (key !== recepie.key) return recepie;

      recepie.chosenVariant = recepie.btns[arg].title;

      return { ...recepie };
    });

    setRecepies(updatedRecepies);
  };

  const handleSaveRecepies = () => {
    setRecepiesEdit((prev) => true);
    setPrevRecepies(() => [...recepies]);

    const formData = new FormData();

    const inputs = formRef.current.querySelectorAll('input[type="text"]');

    inputs.forEach((input) => {
      formData.append(input.name, input.value);
    });

    // console.log(formData)

    submit(formData, { replace: true, method: "POST" });
  };

  const handleExportImage = () => {
    const imagePreview = imageRef.current;
    const sizes = imagePreview.getBoundingClientRect();

    html2canvas(imagePreview, {
      allowTaint: true,
      taintTest: false,
      useCORS: true, // Ensure CORS is used if necessary
      type: "view",
    }).then(function (canvas) {
      const sreenshot = canvasWrap.current;
      const downloadIcon = downloadBtnRef.current;
      canvasWrap.current.innerHTML = "";
      const imgData = canvas.toDataURL("image/jpeg");

      canvas.toBlob((blob) => {
        // return
        const url = URL.createObjectURL(blob);
        downloadIcon.href = url;
        downloadIcon.download = customer.firstName + ".pdf";
        downloadIcon.click();

        // Cleanup: Revoke the object URL after the download is triggered
        URL.revokeObjectURL(url);
      }, "image/jpeg");
    });
  };

  const handlePrint = () => {
    // useReactToPrint({
    //     content:() => componentRef.current
    // })
  };

  const { usePDF } = pkg;

  let handleClickPrint = () => {};

  let targetPringRef = useRef(null);

  if (usePDF) {
    const { toPDF, targetRef } = usePDF({
      filename: `${param.id}.pdf`,
      page: {
        format: "A6",
        orientation: "landscape",
      },
      // format: 'A6',
      // orientation: 'landscape',
    });
    handleClickPrint = () => toPDF();
    targetPringRef = targetRef;
  }

  return (
    <>
      <Page>
        <TitleBar title={`CustomerID: ${param.id}`}></TitleBar>
        <BlockStack gap="500">
          <Link to={`/app`}>{"< Back"}</Link>
          {/* <a href="" target={'_blank'}>
                {'< Back'}
                </a> */}
          {/* <a href="/app/customers">
                    {'< Back'}
                </a> */}
          <Layout>
            <Layout.Section>
              <Card>
                <div className="row">
                  <h2 className="h2">Main page of customer</h2>

                  <a
                    href={`https://admin.shopify.com/store/e7098f-02/customers/${id}`}
                  >
                    Click here
                  </a>
                </div>

                <hr />

                <div className="row">
                  <h2 className="h2">Customer info</h2>

                  <div className="customer-info-wrap">
                    <div className="customer-info">
                      <h3 className="h3">First name</h3>
                      <p>{customer.firstName}</p>
                    </div>
                    <div className="customer-info">
                      <h3 className="h3">Last name</h3>
                      <p>{customer.lastName}</p>
                    </div>
                    <div className="customer-info">
                      <h3 className="h3">Email</h3>
                      <p>{customer.email}</p>
                    </div>
                    <div className="customer-info">
                      <h3 className="h3">Phone</h3>
                      <p>{customer.phone ? customer.phone : "-"}</p>
                    </div>
                    <div className="customer-info">
                      <h3 className="h3">Created at</h3>
                      <p>{customer.createdAt}</p>
                    </div>
                    <div className="customer-info">
                      <h3 className="h3">Updated at</h3>
                      <p>{customer.updatedAt}</p>
                    </div>
                    {/* <div className="customer-info">
                                        <h3 className="h3">
                                            Notes
                                        </h3>
                                        <p>
                                            {customer.note}
                                        </p>
                                    </div> */}
                  </div>
                </div>
                {/* <Link url={`https://admin.shopify.com/store/aurea-dev/customers/${id}`}>
                                Click here
                            </Link> */}
              </Card>
            </Layout.Section>
            <Layout.Section>
              <Card>
                <h2 className="h2">Answers </h2>
                <button
                  style={{
                    marginTop: 15,
                    padding: "5px 10px",
                    borderRadius: 10,
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                  className="recepies-btn-export"
                  onClick={() => {
                    setIsOldVersion((prev) => !prev);
                  }}
                >
                  {!isOldVersion ? "Show old version" : "Hide old version"}
                </button>
                <div
                  style={{
                    marginTop: 15,
                    fontSize: 15,
                    fontWeight: "bold",
                  }}
                >
                  <h3
                    style={{
                      display: "inline",
                    }}
                  >
                    Order:
                  </h3>{" "}
                  <a
                    style={{
                      display: "inline",
                      color: "rgb(126, 178, 142)",
                    }}
                    target="_blank"
                    href={`https://admin.shopify.com/store/e7098f-02/orders/${order2.id}`}
                  >
                    {order2.id}
                  </a>
                </div>
                <div className="anserws-grid">
                  {/* {questions.map((question, index) => {
                                    return <div className="question" key={`question-${index}`}>
                                    <div className="question-title">
                                        {question.question}
                                    </div>
                                    <div className="question-anserws">
                                        {question.anserws.map((anserw, _index) =>{
                                            // console.log("anserw:" , anserw , parsedNotes[index])
                                            return <button key={`question-anserw-${index}-${_index}`} className={`anserw ${anserw == parsedNotes[index] ? "hello" :"hidden"}`}>
                                                {anserw}
                                            </button>
                                        })}
                                    </div>
                                
                                    </div>
                                })} */}
                  {isOldVersion &&
                    parsedNotes.map((note, index) => {
                      return (
                        <>
                          <div className="question" key={`question2-${index}`}>
                            <div className="question-title">
                              {note.question}
                            </div>
                            <div className="question-anserws">
                              {note.questionType == "radio" &&
                                note.asnerwValues.map((value, _index) => (
                                  <button
                                    disabled
                                    key={`question-anserw-${index}-${_index}`}
                                    className={`anserw ${value == note.answer ? "hello" : "hidden"}`}
                                  >
                                    {value}
                                  </button>
                                ))}
                              {(note.questionType == "text" ||
                                note.questionType == "number") && (
                                <button
                                  disabled
                                  key={`question-anserw-${1}-${1}`}
                                  className={`anserw ${true == true ? "hello" : "hidden"}`}
                                >
                                  {note.answer}
                                </button>
                              )}
                              {note.questionType == "checkbox" &&
                                note.asnerwValues.map((value, _index) => {
                                  for (
                                    let i = 0;
                                    i < JSON.parse(note.answer).length;
                                    i++
                                  ) {
                                    const element = JSON.parse(note.answer)[i];
                                    if (element === value) {
                                      return (
                                        <button
                                          disabled
                                          key={`question-anserw-${index}-${_index}`}
                                          className={`anserw hello`}
                                        >
                                          {value}
                                        </button>
                                      );
                                    }
                                  }
                                  return (
                                    <button
                                      disabled
                                      key={`question-anserw-${index}-${_index}`}
                                      className={`anserw hidden`}
                                    >
                                      {value}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        </>
                      );
                    })}

                  <ul
                    style={{
                      margin: 0,
                      gridColumn: "1 / 3",
                      padding: "0 15px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                    }}
                  >
                    {!isOldVersion &&
                      order2.line_items.map((product) => {
                        return (
                          <li>
                            <h2
                              style={{
                                fontWeight: 700,
                                fontSize: 17,
                                paddingBottom: 10,
                                marginBottom: 0,
                                borderBottom: "2px solid black",
                              }}
                            >
                              {product.name}
                            </h2>
                            <ul
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                padding: 0,
                              }}
                            >
                              {product.properties.map((property) => {
                                return (
                                  // eslint-disable-next-line react/jsx-key
                                  <li
                                    style={{
                                      listStyle: "none",
                                      marginBottom: 10,
                                      marginTop: 10,
                                    }}
                                  >
                                    <div>
                                      <h3
                                        style={{
                                          fontSize: 15,
                                        }}
                                      >
                                        <b>{property.name}:</b>
                                      </h3>
                                      <div
                                        style={{
                                          paddingTop: 10,
                                        }}
                                      >
                                        {property.value}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </Card>
            </Layout.Section>
            <Layout.Section>
              <Card>
                <h2 className="h2">Recepies</h2>
                <div
                  className={`recepie-table ${!recepiesIsEditable && "edit"}`}
                >
                  {recepies.map((recepie, __index) => {
                    return (
                      <div key={`editable-${__index}`} className="recepie-row">
                        <button
                          key={`editable-${__index}-btn-minus`}
                          onClick={() =>
                            changeRecepiesChosenValue(-1, recepie.key)
                          }
                          className={`recepie-btn editable left ${!recepiesIsEditable && "on"}`}
                        >
                          -
                        </button>
                        <button
                          key={`editable-${__index}-btn-plus`}
                          onClick={() =>
                            changeRecepiesChosenValue(1, recepie.key)
                          }
                          className={`recepie-btn editable right ${!recepiesIsEditable && "on"}`}
                        >
                          +
                        </button>
                        <div className="recepie-label">{recepie.title}</div>
                        <div className="recepie-results">
                          {recepie.btns.map((recepieBtn, _btnIndex) => {
                            // const value = parsedMetafields.find(({node} = metafield) => node.key === recepie.key).value || '-'
                            return (
                              <button
                                onClick={() =>
                                  changeRecepiesChosenValueBtnClick(
                                    _btnIndex,
                                    recepie.key,
                                  )
                                }
                                key={`editable-${__index}-${_btnIndex}`}
                                className={`recepie-btn ${recepie.chosenVariant === recepieBtn.title && "chosen"}`}
                              >
                                {recepieBtn.title}
                              </button>
                            );
                          })}
                          {/* active btn have class chosen */}
                        </div>
                      </div>
                    );
                  })}

                  {false &&
                    prevRecepies.map((recepie, __index) => {
                      return (
                        <div
                          key={`previus-noteditable-${__index}`}
                          className="recepie-row"
                        >
                          <button
                            onClick={() =>
                              changeRecepiesChosenValue(-1, recepie.key)
                            }
                            className={`recepie-btn editable left ${!recepiesIsEditable && "on"}`}
                          >
                            -
                          </button>
                          <button
                            onClick={() =>
                              changeRecepiesChosenValue(1, recepie.key)
                            }
                            className={`recepie-btn editable right ${!recepiesIsEditable && "on"}`}
                          >
                            +
                          </button>
                          <div className="recepie-label">{recepie.title}</div>
                          <div className="recepie-results">
                            {recepie.btns.map((recepieBtn, _btnIndex) => {
                              // const value = parsedMetafields.find(({node} = metafield) => node.key === recepie.key).value || '-'
                              return (
                                <button
                                  key={`editable-${__index}-${_btnIndex}`}
                                  className={`recepie-btn ${recepie.chosenVariant === recepieBtn.title && "chosen"}`}
                                >
                                  {recepieBtn.title}
                                </button>
                              );
                            })}
                            {/* active btn have class chosen */}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="row">
                  {/* <div className="recepies-btns"> */}
                  <form className="recepies-btns" method="post" ref={formRef}>
                    {recepies.map((recepie, _index) => {
                      return (
                        <>
                          <input
                            disabled
                            style={{ display: "none" }}
                            key={`input-namespace-${_index}`}
                            name={`namespace${_index}`}
                            value={recepie.namespace}
                            type="text"
                          />
                          <input
                            disabled
                            style={{ display: "none" }}
                            key={`input-chosenvariant-${_index}`}
                            type="text"
                            value={recepie.chosenVariant}
                            name={`value${_index}`}
                          />
                          <input
                            disabled
                            style={{ display: "none" }}
                            key={`input-key-${_index}`}
                            type="text"
                            value={recepie.key}
                            name={`key${_index}`}
                          />
                        </>
                      );
                    })}
                    <input
                      disabled
                      style={{ display: "none" }}
                      type="text"
                      value={customer.id}
                      name={`customerID`}
                    />
                    {/* <input
                      disabled
                      style={{ display: "none" }}
                      type="text"
                      value={order2.id}
                      name={`orderID`}
                    /> */}
                  </form>

                  <div className="recepies-btns">
                    <div
                      className="recepies-btn-edit edit"
                      onClick={handleEditRecepies}
                    >
                      {recepiesIsEditable ? "Edit" : "Cancel"}
                    </div>
                    {!recepiesIsEditable && (
                      <button
                        type="submit"
                        className="recepies-btn-export save"
                        ref={submitRef}
                        onClick={handleSaveRecepies}
                      >
                        Save
                      </button>
                    )}
                    {recepiesIsEditable && (
                      <a href="#preview" className="recepies-btn-export">
                        Go to preview
                      </a>
                    )}
                  </div>
                  {/* </div> */}
                </div>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <div className="" id="preview">
                <Card>
                  <div className="imgWrap">
                    <h2 className="h2">Production date:</h2>
                    <div className="img_prev_container">
                      <div
                        className="img_prev no-borders"
                        style={{ border: "none" }}
                      >
                        <div className="row date_row">
                          <div className="col">
                            <DatePickerExample
                              month={month}
                              year={year}
                              setDate={setDate}
                              selectedDates={selectedDates}
                              setSelectedDates={setSelectedDates}
                            />
                          </div>
                          <div className="col date_row__result_col">
                            <span className="date_row__symbol">+</span>
                            <div className="date_row__input_container__outer">
                              <input
                                type="number"
                                className="date_row__input_container"
                                onChange={(e) => setRangeValue(e.target.value)}
                                defaultValue={rangeValue}
                              />
                              <span>days</span>
                            </div>
                            <span className="date_row__symbol">=</span>
                            <span className="data_row__result_date">
                              Best before:{" "}
                              <RenderDate
                                selectedDates={selectedDates}
                                rangeValue={Number(rangeValue)}
                              />
                            </span>
                            {/* <p>
                                                        Number of days: <input type="number" onChange={(e)=>setRangeValue(e.target.value)} defaultValue={rangeValue} />
                                                    </p>
                                                    <p>
                                                        {day}.{month2}.{year2} + {rangeValue} days = <RenderDate selectedDates={selectedDates} rangeValue={Number(rangeValue)} /> 
                                                    </p> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </Layout.Section>

            <Layout.Section>
              <div className="" id="preview">
                <Card>
                  {/* <PrintableComponent ref={componentRef}> */}
                  <div className="imgWrap">
                    <h2 className="h2">Preview:</h2>

                    <div className="img_prev_container">
                      {/* ref={imageRef} */}
                      <div
                        className=""
                        style={{
                          width: 804,
                          border: "2px solid black",
                          margin: "0 auto",
                        }}
                      >
                        <div
                          className="img_prev no-borders"
                          ref={targetPringRef}
                        >
                          <div className="image_prev_grid">
                            <div className="image_prev_grid_col">
                              <div className="image_prev_title">
                                <b>Made for {customer.firstName || param.id}</b>
                              </div>
                            </div>
                            <div className="image_prev_grid_col">
                              <div className="image_prev_title rightAlign">
                                <b>Food Supplement</b>
                              </div>
                            </div>
                            <div className="image_prev_grid_col_full">
                              <b>Ingredients</b>
                              <p style={{ whiteSpace: "pre-wrap" }}>
                                {prevRecepies
                                  .filter((recepie, __index) => {
                                    if (
                                      recepie.chosenVariant === "-" ||
                                      recepie[
                                        recepie.chosenVariant.toLowerCase()
                                      ] === 0
                                    ) {
                                      return false;
                                    }
                                    return true;
                                  })
                                  .map((recepie) => {
                                    return recepie.ingredientName;
                                  })
                                  .toString()
                                  .replaceAll(",", ", ")}
                                , Hydroxypropylmethylcellulose (HPMC-Capsule),
                                Maltodextrin
                                {/* {textareaValue} */}
                              </p>
                              {/* Vitamin B6, Vitamin B9, Vitamin B12, Vitamin C, Vitamin D, Calciumcarbonate, Ironbisgl ycinate, Selenmethionine, Zincbisgl ycinate, Hydroxy prop y lmeth y lcellulose (HPMC-Capsule) */}
                            </div>
                            <div className="image_prev_grid_col">
                              <div className="image_prev_table">
                                <div className="image_prev_row image_prev_row_head">
                                  <div className="image_prev_col">
                                    1 capsule (daily dose) provides
                                  </div>
                                  <div className="image_prev_col">
                                    {/* %NRV* */}
                                  </div>
                                  <div className="image_prev_col">%NRV*</div>
                                </div>
                                {prevRecepies
                                  .filter((recepie) => {
                                    if (
                                      recepie.chosenVariant === "-" ||
                                      recepie[
                                        recepie.chosenVariant.toLowerCase()
                                      ] === 0
                                    )
                                      return false;
                                    return true;
                                  })
                                  ?.map((recepie, __index) => {
                                    const nrv =
                                      Math.round(
                                        (recepie[
                                          recepie.chosenVariant.toLowerCase()
                                        ] /
                                          recepie.nrv) *
                                          100,
                                      ) / 100;
                                    return (
                                      <div
                                        key={`image-${__index}`}
                                        className="image_prev_row"
                                      >
                                        <div className="image_prev_col">
                                          {recepie.title}
                                        </div>
                                        <div className="image_prev_col">
                                          {
                                            recepie[
                                              recepie.chosenVariant.toLowerCase()
                                            ]
                                          }{" "}
                                          {recepie.unit}
                                        </div>
                                        <div className="image_prev_col">
                                          {/* {nrv  > 1 && '>' } */}
                                          {(nrv * 100).toFixed(0)}%
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                            <div className="image_prev_grid_col">
                              <div className="image_prev_grid_col_recepie">
                                <p>
                                  <b>Recommended Daily Intake:</b>1 capsule with
                                  food. Do not exceed the recommended daily
                                  intake
                                  {/* 1 capsule with food. Do not exceed the recommended dail y intake */}
                                </p>

                                <p>
                                  <b>Suitable for vegetarians.</b>
                                </p>

                                <p>
                                  <b>
                                    Food supplements must not be used as a
                                    substitute for a varied, balanced diet and a
                                    healthy lifestyle.
                                  </b>
                                </p>

                                <p>
                                  <b>
                                    Store in a cool dry place away from direct
                                    heat. KEEP OUT OF REACH OF CHILDREN
                                  </b>
                                </p>

                                <div className="">
                                  <p>
                                    <b>Best before:</b>{" "}
                                    <RenderDate
                                      selectedDates={selectedDates}
                                      rangeValue={Number(rangeValue)}
                                    />
                                    {/* {`${day}.${month}.${year}` } */}
                                  </p>
                                  {/* <p>
                                                                    {`${day}.${month}.${year}` }
                                                                </p> */}
                                  <br />
                                  <p>
                                    <b>Recipe ID:</b> {param.id}
                                  </p>
                                </div>
                                <p>
                                  <b>
                                    {/* {customer.addresses[0]} */}
                                    bloonce UG
                                    <br />
                                    Kapellenstr. 5053332 Bornheim, Germany
                                  </b>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div
                            className="image_prev_grid"
                            style={{ marginTop: "auto" }}
                          >
                            <div className="image_prev_grid_col">
                              *NRV means Nutrient Reference Value
                              <br />
                              <b>30 capsules</b>
                            </div>
                            <div
                              className="image_prev_grid_col"
                              style={{ marginTop: "auto" }}
                            >
                              <b>Made in Germany</b>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* </PrintableComponent> */}

                  <div className="row">
                    <div className="recepies-btns">
                      {recepiesIsEditable && (
                        <button
                          onClick={() => {
                            handleClickPrint();
                            // generatePDF(targetPringRef, options)
                            setTextareaValue("");
                          }}
                          className="recepies-btn-export"
                        >
                          Export
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="row" style={{ display: "none" }}>
                    <h2 className="h2">Canvas:</h2>
                    <div
                      className=""
                      ref={canvasWrap}
                      style={{
                        flexDirection: "column",
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                      }}
                    >
                      <p>NULL</p>
                      <p>Create to export</p>
                    </div>
                    <div className="recepies-btns canvasWrap">
                      {/* href={image} */}
                      <a className="recepies-btn-export" ref={downloadBtnRef}>
                        Download
                      </a>
                    </div>
                  </div>
                </Card>
              </div>
            </Layout.Section>
          </Layout>
          <div className="blank"></div>
        </BlockStack>
      </Page>
    </>
  );
}

function DatePickerExample({
  month,
  year,
  setDate,
  selectedDates,
  setSelectedDates,
}) {
  // const [{month, year}, setDate] = useState({month: 1, year: 2018});
  // const [selectedDates, setSelectedDates] = useState({
  //   start: new Date('Wed Feb 07 2018 00:00:00 GMT-0500 (EST)'),
  //   end: new Date('Wed Feb 07 2018 00:00:00 GMT-0500 (EST)'),
  // });

  const handleMonthChange = useCallback(
    (month, year) => setDate({ month, year }),
    [],
  );

  return (
    <DatePicker
      month={month}
      year={year}
      onChange={setSelectedDates}
      onMonthChange={handleMonthChange}
      selected={selectedDates}
    />
  );
}

function RenderDate({ selectedDates, rangeValue = 0 }) {
  const today = new Date(selectedDates.end);
  const day = String(today.getDate()).padStart(2, "0");
  // today.getDate();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  // today.getMonth() + 1; // Months are zero-indexed
  const year = today.getFullYear();

  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + rangeValue);

  const futureDateDay = String(futureDate.getDate()).padStart(2, "0");
  // today.getDate();
  const futureDateMonth = String(futureDate.getMonth() + 1).padStart(2, "0");
  // today.getMonth() + 1; // Months are zero-indexed
  const futureDateYear = futureDate.getFullYear();

  if (rangeValue > 0) {
    return `${futureDateDay}.${futureDateMonth}.${futureDateYear}`;
  }

  return `${day}.${month}.${year}`;
}
