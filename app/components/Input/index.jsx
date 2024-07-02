
import {
    Page,
    Layout,
    BlockStack,
    Link,
    LegacyCard,
    DataTable,
    Autocomplete, Icon,
  } from "@shopify/polaris";

export const Input = ({value="",callback = () => null,icon, placeholder}) => {
    return (
        <Autocomplete.TextField
            onChange={callback}
            // label="Customers in priority list"
            value={value}
            prefix={icon}
            placeholder={placeholder || 'empty'}
            autoComplete="off"
        />
    )
}