const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken, authorize } = require('../middleware/auth');

router.use(verifyToken);

router.get('/get', authorize, profileController.getProfile);        
router.post('/edit', authorize, profileController.saveProfile);     
router.post('/profile', upload.single("image"), saveProfile);

module.exports = router;