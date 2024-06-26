require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const createError = require('http-errors')
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY,{
    apiVersion: '2024-05-23.preview-v2',
  });

const app = express()
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.post('/checkout', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Test Items'
                    },
                    unit_amount: 50 * 100
                },
                quantity: 1
            },
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Test Item 2'
                    },
                    unit_amount: 20 * 100
                },
                quantity: 2
            }            
        ],
        mode: 'payment',
        shipping_address_collection: {
            allowed_countries: ['US', 'BR']
        },
        success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL}/cancel`
    })

    res.redirect(session.url) // this redirects to the stripe url
})

app.get('/complete', async (req, res) => {
    const result = Promise.all([
        stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ['payment_intent.payment_method'] }),
        stripe.checkout.sessions.listLineItems(req.query.session_id)
    ])

    console.log(JSON.stringify(await result))

    res.send('Your payment was successful')
})

app.get('/customers', async (req, res) => {
    const customers = await stripe.customers.list();
     // Extract the 'limit' query parameter from the request
     const { id } = req.query;
    res.send(customers)
})

app.get('/recipients', async (req, res) => {
    const { id } = req.query;
    
    try {
        if (id) {
            // Fetch a specific account if an id is provided
            const customer = await stripe.v2.accounts.retrieve(id);
            res.send(customer);
        } else {
            // Fetch the list of all accounts if no id is provided
            const customers = await stripe.v2.accounts.list();
            res.send(customers);
        }
    } catch (error) {
        // Handle errors (e.g., account not found, Stripe API issues)
        // res.status(500).send({ error: error.message });
        console.error('Stripe API error:', error);
        res.status(500).send({
            error: error.message,
            stripeError: error.raw ? error.raw : null
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
        const account = await stripe.v2.accounts.create({
            type: 'custom',
            email,
            business_type: legal_entity_data.business_type,
            company: {
                name: legal_entity_data.name,
                address: {
                    country: legal_entity_data.country
                }
            },
            metadata: {
                name
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: 'manual'
                    }
                }
            },
            capabilities: {
                transfers: { requested: true }
            },
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: req.ip // Assumes you're using a proxy to get the real IP
            },
            external_account: {
                object: 'bank_account',
                country: legal_entity_data.country,
                currency: 'usd', // Adjust according to your needs
                account_number: '000123456789',
                routing_number: '110000000'
            }
        });
        res.status(201).send(account);
    } catch (error) {
        console.error('Stripe API error:', error);
        res.status(500).send({
            error: error.message,
            stripeError: error.raw ? error.raw : null
        });
    }
});

app.get('/financeAccount', async (req, res) => {
    try {
        // List of financial accounts
        const fBalance = await stripe.financialAccounts.list();
        res.json(fBalance);
      } catch (error) {
        console.error('Error fetching financial accounts:', error);
        res.status(500).send('Internal Server Error');
      }
}) 

app.get('/cancel', (req, res) => {
    res.redirect('/')
})

app.listen(3000, () => console.log('Server started on port 3000'))