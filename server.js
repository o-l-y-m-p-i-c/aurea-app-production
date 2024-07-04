require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;

app.use(express.json());

app.get('/proxy', async (req, res) => {
  try {
    const { url, method, body, useShopifyAuth } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const axiosConfig = {
      method: method || 'GET',
      url: url,
      headers: {}
    };

    if (useShopifyAuth === 'true' && shopifyAccessToken) {
      axiosConfig.headers['X-Shopify-Access-Token'] = shopifyAccessToken;
      axiosConfig.headers['Access-Control-Allow-Origin'] = '*';
      axiosConfig.headers['Content-Type'] = 'application/json';
    }

    if (body) {
      try {
        axiosConfig.data = JSON.parse(body);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid body JSON' });
      }
    }

    const response = await axios(axiosConfig);

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'An error occurred while processing your request' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Shopify Auth ${shopifyAccessToken ? 'is' : 'is not'} configured`);
});