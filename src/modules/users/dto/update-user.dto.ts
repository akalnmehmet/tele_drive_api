import { z } from 'zod';

export const UpdateUserDto = z.object({
  role: z.enum(['fleet_manager', 'engineer']),
});

export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
