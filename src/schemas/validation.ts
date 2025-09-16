import { z } from 'zod';
import { APP_CONFIG } from '@/config/app';

// User validation schemas
export const usernameSchema = z.string()
  .min(APP_CONFIG.VALIDATION.MIN_USERNAME_LENGTH, 'Mínimo ' + APP_CONFIG.VALIDATION.MIN_USERNAME_LENGTH + ' caracteres')
  .max(APP_CONFIG.VALIDATION.MAX_USERNAME_LENGTH, 'Máximo ' + APP_CONFIG.VALIDATION.MAX_USERNAME_LENGTH + ' caracteres')
  .regex(APP_CONFIG.VALIDATION.USERNAME_REGEX, 'Solo letras, números y guiones bajos')
  .refine(val => !val.startsWith('_') && !val.endsWith('_'), 
    'No puede empezar o terminar con guión bajo');

export const emailSchema = z.string()
  .email('Formato de email inválido')
  .regex(APP_CONFIG.VALIDATION.EMAIL_REGEX, 'Formato de email inválido');

export const passwordSchema = z.string()
  .min(APP_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH, 'Mínimo ' + APP_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH + ' caracteres');

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  username: usernameSchema,
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Betting validation schemas
export const betSelectionSchema = z.object({
  fixtureId: z.number().positive('ID de partido inválido'),
  market: z.string().min(1, 'Mercado requerido'),
  selection: z.string().min(1, 'Selección requerida'),
  odds: z.number().positive('Cuota debe ser positiva'),
  matchDescription: z.string().min(1, 'Descripción del partido requerida'),
  kickoff: z.string().min(1, 'Hora de inicio requerida'),
});

export const betSchema = z.object({
  stake: z.number()
    .positive('El importe debe ser positivo')
    .min(0.01, 'El importe mínimo es 0.01'),
  selections: z.array(betSelectionSchema)
    .min(1, 'Debe seleccionar al menos una apuesta')
    .max(APP_CONFIG.BETTING.MAX_SELECTIONS_PER_BET, 'Máximo ' + APP_CONFIG.BETTING.MAX_SELECTIONS_PER_BET + ' selecciones por apuesta'),
}).refine(data => {
  // Check for duplicate fixtures
  const fixtureIds = data.selections.map(s => s.fixtureId);
  return new Set(fixtureIds).size === fixtureIds.length;
}, {
  message: 'No se pueden combinar múltiples selecciones del mismo partido',
  path: ['selections'],
});

// League validation schemas
export const leagueSchema = z.object({
  name: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  budget: z.number()
    .positive('Presupuesto debe ser positivo')
    .min(100, 'Presupuesto mínimo 100'),
  minBet: z.number()
    .positive('Apuesta mínima debe ser positiva')
    .min(1, 'Apuesta mínima debe ser al menos 1'),
  maxBet: z.number()
    .positive('Apuesta máxima debe ser positiva')
    .optional(),
}).refine(data => !data.maxBet || data.maxBet >= data.minBet, {
  message: 'La apuesta máxima debe ser mayor o igual a la mínima',
  path: ['maxBet'],
});

// News validation schemas
export const newsSchema = z.object({
  title: z.string()
    .min(5, 'Mínimo 5 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  content: z.string()
    .min(10, 'Mínimo 10 caracteres')
    .max(5000, 'Máximo 5000 caracteres'),
  isImportant: z.boolean().optional(),
});

// Type exports
export type UsernameInput = z.infer<typeof usernameSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BetSelectionInput = z.infer<typeof betSelectionSchema>;
export type BetInput = z.infer<typeof betSchema>;
export type LeagueInput = z.infer<typeof leagueSchema>;
export type NewsInput = z.infer<typeof newsSchema>;
