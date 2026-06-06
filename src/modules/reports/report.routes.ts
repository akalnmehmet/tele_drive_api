import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { CreateReportDto } from './dto/create-report.dto';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /reports:
 *   get:
 *     tags: [Reports]
 *     summary: Kullanıcının raporlarını listele
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: '{ reports, total, limit, offset }'
 *   post:
 *     tags: [Reports]
 *     summary: Yeni rapor talebi oluştur (asenkron)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateReportDto' }
 *     responses:
 *       202: { description: Rapor kuyruğa alındı }
 */
router.get('/',    ReportController.findAll);
router.post('/',   validate(CreateReportDto), ReportController.create);

/**
 * @openapi
 * /reports/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Rapor detayı ve durumu
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Rapor nesnesi }
 *       404: { description: Rapor bulunamadı }
 */
router.get('/:id', ReportController.findOne);

/**
 * @openapi
 * /reports/{id}/download:
 *   get:
 *     tags: [Reports]
 *     summary: Tamamlanan raporu indir
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Dosya içeriği (PDF veya Excel)
 *         content:
 *           application/pdf: {}
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet: {}
 *       404: { description: Rapor bulunamadı veya henüz hazır değil }
 */
router.get('/:id/download', ReportController.download);

export default router;
