import * as z from "zod";

export const SignInSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

export const SignUpSchema = z.object({
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).regex(/^[a-zA-Z\s]+$/, {
    message: "Name can only contain alphabets and spaces.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});
