import z from 'zod'

const RegisterUserSchema = z.object({
	cedula: z.string(),
	name: z.string(),
	lastName: z.string(),
	email: z.email(),
	password: z.string(),
	confirmPassword: z.string(),
	address: z.string(),
	profile: z.instanceof(Buffer).optional(),
})

const LoginSchema = z.object({
	email: z.email(),
	password: z.string(),
})

export { RegisterUserSchema, LoginSchema }
