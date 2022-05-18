const express = require('express');
const socketIO = require('socket.io');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT;

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

const socketHandler = socketIO(server);

socketHandler.on('connection', (socket) => {
  socket.on('connect_error', (err) => {
    console.log(`connection error: ${err}`);
  });
  socket.on('disconnect', () => {
    console.log(`Client disconnected`);
  });

  console.log(`Client connected`);
});

const getPrices = () => {
  axios
    .get(process.env.LIST_URL, {
      headers: { 'x-messari-api-key': process.env.CRYPTO_API_KEY },
    })
    .then((res) => {
      const priceList = res.data.data.map((item) => ({
        id: item.id,
        name: item.symbol,
        price: item.metrics.market_data.price_usd,
      }));
      socketHandler.emit('crypto', priceList);
    })
    .catch((error) => {
      console.log(error);
      socketHandler.emit('crypto', {
        error: true,
        message: ' Error fetching prices from API',
      });
    });
};

setInterval(() => {
  getPrices();
}, 60000);

app.get('/cryptos/profile', (req, res) => {
  res.json({ error: true, message: 'Missing Crypto Id in the API URL' });
});

app.get('/cryptos/profile/:id', (req, res) => {
  const cryptoId = req.params.id;
  console.log('cryptoId', cryptoId);

  if (!cryptoId) {
    res.json({ error: true, message: 'Missing crypto id in the url' });
  }

  axios
    .get(`https://data.messari.io/api/v2/assets/${cryptoId}/profile`, {
      headers: { 'x-messari-api-key': process.env.CRYPTO_API_KEY },
    })
    .then((responseData) => {
      console.log('responseData.data', responseData.data);
      res.json(responseData.data.data);
    })
    .catch((err) => {
      console.log('error', error);
      res.json('crypto', {
        error: true,
        message: 'Error fetching price data from api',
        errorDetails: err,
      });
    });
});

app.get('/cryptos/market-data/:id', (req, res) => {
  const cryptoId = req.params.id;
  console.log('cryptoId', cryptoId);
  if (!cryptoId) {
    res.json({ error: true, message: 'Missing crypto id in the url' });
  }

  axios
    .get(
      `https://data.messari.io/api/v1/assets/${cryptoId}/metrics/market-data`,
      {
        headers: { 'x-messari-api-key': process.env.CRYPTO_API_KEY },
      }
    )
    .then((responseData) => {
      console.log('responseData.data', responseData.data);
      res.json(responseData?.data?.data);
    })
    .catch((err) => {
      console.log('err', err);
      res.json('crypto', {
        error: true,
        message: 'Error fetching price data from api',
        errorDetails: err,
      });
    });
});
