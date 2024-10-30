import { z } from 'zod';

export const resetPasswordSchema = z.object({
	email: z.string().email()
});

export type ResetPasswordSchema = typeof resetPasswordSchema;
