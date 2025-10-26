const express = require('express');
const router = express.Router();

const helpers = require('../data/helpers.json');

router.get('/', (req, res) => {
  res.json(helpers);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const helper = helpers.find((h) => String(h.id) === String(id));
  if (!helper) return res.status(404).json({ error: 'Helper not found' });
  res.json(helper);
});

module.exports = router;