import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { UserController } from './user.controller';
import { UpdateUserDto } from './dto/update-user.dto';

const router = Router();

router.use(authenticate);
router.use(authorize('fleet_manager'));

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Kullanıcıları listele (fleet_manager)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: '{ users, total }' }
 */
router.get('/',     UserController.findAll);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Kullanıcı detayı
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Kullanıcı nesnesi (şifresiz) }
 *       404: { description: Kullanıcı bulunamadı }
 *   patch:
 *     tags: [Users]
 *     summary: Kullanıcı rolünü güncelle
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [fleet_manager, engineer] }
 *     responses:
 *       200: { description: Güncellenmiş kullanıcı }
 *       400: { description: Kendi rolünü değiştirme yasak }
 *   delete:
 *     tags: [Users]
 *     summary: Kullanıcı sil
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Silindi }
 *       400: { description: Kendi hesabını silme yasak }
 */
router.get('/:id',  UserController.findOne);
router.patch('/:id',
  validate(UpdateUserDto),
  UserController.updateRole,
);
router.delete('/:id', UserController.remove);

export default router;
