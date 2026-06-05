import { z } from 'zod';

export const LoginDto = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gerekli'),
});

export type LoginDto = z.infer<typeof LoginDto>;
