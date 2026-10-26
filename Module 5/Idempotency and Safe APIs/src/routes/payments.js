'use strict';
// routes/payments.js — idempotent payment endpoint

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {
  const key = req.headers['idempotency-key'];

  // Without a caller-provided key, retries cannot be safely deduplicated.
  if (typeof key !== 'string' || key.trim() === '') {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required',
      },
    });
  }

  // Return the exact saved status and response body for a retry.
  if (idempotency.has(key)) {
    const saved = idempotency.get(key);
    return res.status(saved.status).json(saved.body);
  }

  // New key: perform one charge and cache the complete response.
  const amount = req.body && req.body.amount;
  const charge = { id: nextChargeId(), amount, status: 'charged' };
  charges.push(charge);

  const body = { id: charge.id, amount: charge.amount, status: charge.status };
  const status = 201;
  idempotency.set(key, { status, body });

  return res.status(status).json(body);
});

module.exports = router;
