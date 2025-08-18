const express = require('express');
const router = express.Router();

const { verifyToken, authorize } = require('../middlewares/auth');

router.get('/get', authorize, getProfile);        
router.post('/edit', authorize, saveProfile);     

module.exports = router;