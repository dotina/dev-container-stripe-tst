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

// app.post('/recipients', async (req, res) => {
//     // Validate that req.body is defined
//     if (!req.body) {
//         return res.status(400).send({ error: 'Request body is missing' });
//     }
    
//     const { name, email, legal_entity_data, configuration } = req.body;

//     // Validate required fields
//     if (!name || !email || !legal_entity_data || !configuration) {
//         return res.status(400).send({ error: 'Missing required fields: name, email, legal_entity_data, or configuration' });
//     }

//     try {
//         const account = await stripe.v2.accounts.create({
//             type: 'custom',
//             email,
//             business_type: legal_entity_data.business_type,
//             company: {
//                 name: legal_entity_data.name,
//                 address: {
//                     country: legal_entity_data.country
//                 }
//             },
//             metadata: {
//                 name
//             },
//             settings: {
//                 payouts: {
//                     schedule: {
//                         interval: 'manual'
//                     }
//                 }
//             },
//             capabilities: {
//                 transfers: { requested: true }
//             },
//             tos_acceptance: {
//                 date: Math.floor(Date.now() / 1000),
//                 ip: req.ip
//             },
//             external_account: {
//                 object: 'bank_account',
//                 country: legal_entity_data.country,
//                 currency: 'usd', // Adjust according to your needs
//                 account_number: '000123456789',
//                 routing_number: '110000000'
//             }
//         });
//         res.status(201).send(account);
//     } catch (error) {
//         console.error('Stripe API error:', error);
//         res.status(500).send({
//             error: error.message,
//             stripeError: error.raw ? error.raw : null
//         });
//     }
// });

// app.get('/financeAccount', async (req, res) => {
//     try {
//         // List of financial accounts
//         const fBalance = await stripe.financialAccounts.list();
//         res.json(fBalance);
//       } catch (error) {
//         console.error('Error fetching financial accounts:', error);
//         res.status(500).send('Internal Server Error');
//       }
// }) 

// app.get('/cancel', (req, res) => {
//     res.redirect('/')
// })

app.listen(3000, () => console.log('Server started on port 3000'))