require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const createError = require('http-errors')
const bodyParser = require('body-parser');
const axios = require('axios');
const https = require('https');

const app = express()
// Middleware to parse JSON bodies
app.use(bodyParser.json());

const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripeVersion = '2024-05-23.preview-v2';



// This method unifies the header and base url calls 
const axiosInstance = axios.create({
    baseURL: process.env.STRIP_BASE_URL_v2,
    headers: {
        'Authorization': `Bearer ${stripeApiKey}`,
        'Stripe-Version': stripeVersion,
        'Content-Type': 'application/json'
    },
    httpsAgent: new https.Agent({ keepAlive: true }) // Enable HTTP keep-alive
});

app.get('/recipients', async (req, res) => {
    const { id } = req.query;

    try {
        const url = id ? `accounts/${id}` : 'accounts';
        const response = await axiosInstance.get(url);

        res.send(response.data);
    } catch (error) {
        console.error('Stripe API error:', error);
        res.status(500).send({
            error: error.response ? error.response.data : error.message
        });
    }
});

app.get('/financeAccounts', async (req, res) => {
    const { id, balances } = req.query;

    try {
          // Construct the URL based on the presence of id and balances
          let url = 'financial_accounts';
          if (id) {
              url = `financial_accounts/${id}`;
              if (balances) {
                  url += '/balances';
              }
          }

        const response = await axiosInstance.get(url);

        res.send(response.data);
    } catch (error) {
        console.error('Stripe API error:', error);
        res.status(500).send({
            error: error.response ? error.response.data : error.message
        });
    }
});

app.get('/financeAccountsAddress', async (req, res) => {
    const { id } = req.query;

    try {
        const url = id ? `financial_addresses/${id}` : 'financial_addresses';
        const response = await axiosInstance.get(url);

        res.send(response.data);
    } catch (error) {
        console.error('Stripe API error:', error);
        res.status(500).send({
            error: error.response ? error.response.data : error.message
        });
    }
});

app.post('/recipients', async (req, res) => {
    // Validate that req.body is defined
    if (!req.body) {
        return res.status(400).send({ error: 'Request body is missing' });
    }
    
    const { name, email, legal_entity_data, configuration } = req.body;

    // Validate required fields
    if (!name || !email || !legal_entity_data || !configuration) {
        return res.status(400).send({ error: 'Missing required fields: name, email, legal_entity_data, or configuration' });
    }

    try {
        const accountData = {
            include: [
                "legal_entity_data",
                "configuration.recipient_data"
            ],
            name: name,
            email: email,
            legal_entity_data: {
                business_type: legal_entity_data.business_type,
                country: legal_entity_data.country,
                name: legal_entity_data.name
            },
            configuration: {
                recipient_data: {
                    features: {
                        bank_accounts: {
                            local: {
                                requested: configuration.recipient_data.features.bank_accounts.local.requested
                            },
                            wire:  {
                                requested: configuration.recipient_data.features.bank_accounts.wire.requested
                            }
                        }
                    }
                }
            }
        };

        // Make the POST request to create the account
        const response = await axiosInstance.post('accounts', accountData);

        res.status(201).send(response.data);
    } catch (error) {
        console.error('Stripe API error:', error);
        res.status(500).send({
            error: error.response ? error.response.data : error.message,
            stripeError: error.response ? error.response.data.raw : null
        });
    }
});

// app.get('/cancel', (req, res) => {
//     res.redirect('/')
// })

app.listen(3000, () => console.log('Server started on port 3000'))