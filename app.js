require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const createError = require('http-errors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const app = express()

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
    res.send(customers)
})

app.get('/financeAccount', async (req, res) => {
    const fBalance = await stripe.v2.financialAccounts.list();
    res.send(fBalance)
}) 

app.get('/cancel', (req, res) => {
    res.redirect('/')
})

app.listen(3000, () => console.log('Server started on port 3000'))