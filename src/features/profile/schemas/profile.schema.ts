import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(80),
  username: z
    .string()
    .trim()
    .max(30)
    .regex(/^[a-z0-9_-]*$/i, "Only letters, numbers, - and _ are allowed."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
