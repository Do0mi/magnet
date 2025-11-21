const express = require('express');
const router = express.Router();
const ApplicantController = require('../../../controllers/dashboard/applicants/applicants-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');
const upload = require('../../../middleware/upload-middleware');
const { getBilingualMessage } = require('../../../utils/messages');
const multer = require('multer');

// All dashboard applicant routes require authentication
router.use(verifyToken);

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

// POST /api/v1/dashboard/applicants - Add/Submit an application (with authorization)
router.post('/', requireAdminOrEmployee, upload.single('cv'), handleUploadError, ApplicantController.addApplicant);

// GET /api/v1/dashboard/applicants - Get all applicants
router.get('/', requireAdminOrEmployee, ApplicantController.getApplicants);

// GET /api/v1/dashboard/applicants/:id/cv - Get applicant CV (must come before /:id)
router.get('/:id/cv', requireAdminOrEmployee, ApplicantController.getApplicantCV);

// PUT /api/v1/dashboard/applicants/:id/status - Update applicant status (must come before /:id)
router.put('/:id/status', requireAdminOrEmployee, ApplicantController.updateApplicantStatus);

// GET /api/v1/dashboard/applicants/:id - Get applicant by id
router.get('/:id', requireAdminOrEmployee, ApplicantController.getApplicantById);

// DELETE /api/v1/dashboard/applicants/:id - Delete applicant
router.delete('/:id', requireAdminOrEmployee, ApplicantController.deleteApplicant);

module.exports = router;

