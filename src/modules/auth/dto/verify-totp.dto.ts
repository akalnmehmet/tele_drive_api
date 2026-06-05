import { z } from 'zod';

export const VerifyTotpDto = z.object({
  code: z
    .string()
    .length(6, 'TOTP kodu 6 haneli olmalı')
    .regex(/^\d+$/, 'TOTP kodu yalnızca rakam içermeli'),
});

export type VerifyTotpDto = z.infer<typeof VerifyTotpDto>;
