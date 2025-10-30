import { z } from 'zod';

// Australian Business Number (ABN) - 11 digits
const abnRegex = /^\d{11}$/;

// Australian mobile number formats:
// - +61 4XX XXX XXX
// - 04XX XXX XXX
// - 04XXXXXXXX (no spaces)
// Allow spaces in the number
const australianMobileRegex = /^(\+61\s?4|04)[\d\s]{8,12}$/;

/**
 * Firm validation schema
 * Used for creating and updating firm data
 */
export const firmSchema = z.object({
  entity: z.string().min(1, 'Entity name is required'),
  abn: z
    .string()
    .regex(abnRegex, 'ABN must be exactly 11 digits')
    .optional()
    .or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  contact: z.string().optional().or(z.literal('')),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  mobile: z
    .string()
    .refine(
      (val) => val === '' || australianMobileRegex.test(val),
      'Please enter a valid Australian mobile number (e.g., 0412 345 678 or +61 412 345 678)'
    )
    .optional()
    .or(z.literal('')),
  shortListed: z.boolean().default(false),
});

export type FirmInput = z.infer<typeof firmSchema>;

/**
 * Partial firm schema for updates
 * All fields optional except entity
 */
export const firmUpdateSchema = firmSchema.partial().required({ entity: true });

export type FirmUpdateInput = z.infer<typeof firmUpdateSchema>;

/**
 * Firm reorder schema
 * Used for updating firm display order
 */
export const firmReorderSchema = z.object({
  firmIds: z.array(z.string().cuid()).min(1, 'At least one firm ID is required'),
});

export type FirmReorderInput = z.infer<typeof firmReorderSchema>;
