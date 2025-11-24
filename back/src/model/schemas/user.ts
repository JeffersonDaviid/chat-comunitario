import z from 'zod'

// Función para validar cédula ecuatoriana
const validateEcuadorianId = (cedula: string): boolean => {
	if (!/^\d{10}$/.test(cedula)) return false
	
	const province = parseInt(cedula.substring(0, 2))
	if (province < 1 || province > 24) return false
	
	const digits = cedula.split('').map(Number)
	const verifier = digits[9]
	
	const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
	let sum = 0
	
	for (let i = 0; i < 9; i++) {
		let value = digits[i] * coefficients[i]
		if (value > 9) value -= 9
		sum += value
	}
	
	const calculatedVerifier = (10 - (sum % 10)) % 10
	return verifier === calculatedVerifier
}

const RegisterUserSchema = z.object({
	cedula: z.string().refine(validateEcuadorianId, {
		message: 'Cédula ecuatoriana inválida',
	}),
	name: z.string().min(1, 'El nombre es requerido'),
	lastName: z.string().min(1, 'El apellido es requerido'),
	email: z.string().email('Email inválido'),
	password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
	confirmPassword: z.string(),
	phone: z.string().regex(/^09\d{8}$/, 'El teléfono debe tener 10 dígitos y comenzar con 09'),
	address: z.string().min(1, 'La dirección es requerida'),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	profile: z.instanceof(Buffer).optional(),
})

const LoginSchema = z.object({
	email: z.email(),
	password: z.string(),
})

export { RegisterUserSchema, LoginSchema }
