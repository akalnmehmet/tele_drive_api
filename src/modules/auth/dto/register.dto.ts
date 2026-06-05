import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'En az bir büyük harf içermeli')
    .regex(/[0-9]/, 'En az bir rakam içermeli'),
  role: z.enum(['fleet_manager', 'engineer']).default('engineer'),
});

export type RegisterDto = z.infer<typeof RegisterDto>;
