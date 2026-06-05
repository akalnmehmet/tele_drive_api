import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { CreateReportDto } from './dto/create-report.dto';

const router = Router();

router.use(authenticate);

router.get('/',    ReportController.findAll);
router.post('/',   validate(CreateReportDto), ReportController.create);
router.get('/:id', ReportController.findOne);
router.get('/:id/download', ReportController.download);

export default router;
