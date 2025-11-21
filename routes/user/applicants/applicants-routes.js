const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitApplication } = require('../../../controllers/user/applicants/applicants-controller');
const upload = require('../../../middleware/upload-middleware');
const { getBilingualMessage } = require('../../../utils/messages');

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('file_too_large')
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || getBilingualMessage('upload_failed')
    });
  }
  next();
};

// POST /api/v1/user/applicants - Submit an application (no authentication required)
router.post('/', upload.single('cv'), handleUploadError, submitApplication);

module.exports = router;

