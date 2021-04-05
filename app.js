/* eslint-disable comma-dangle */
/* eslint-disable quotes */
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require('./db');
const path = require('path');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    const token = await User.authenticate(req.body);
    res.send({ token });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', async (req, res, next) => {
  try {
    const user = await User.byToken(req.headers.authorization);

    res.send(user);
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/users/:id/notes', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Note.findAll({
      where: {
        userId: id,
      },
    });
    res.send(data);
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
