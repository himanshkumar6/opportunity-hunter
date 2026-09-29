import { z } from 'zod';

export const leadSearchSchema = z.object({
  niche: z
    .string()
    .trim()
    .min(1, 'Niche is required')
    .max(100, 'Niche must not exceed 100 characters'),
  city: z
    .string()
    .trim()
    .min(1, 'City/Location is required')
    .max(100, 'City must not exceed 100 characters'),
  max_results: z
    .number({ invalid_type_error: 'Number of leads is required' })
    .int('Number of leads must be an integer')
    .min(1, 'Minimum 1 lead is required')
    .max(100, 'Maximum 100 leads per search run'),
  no_website: z.boolean(),
  seo_opportunity: z.boolean(),
  social_opportunity: z.boolean(),
});

export type LeadSearchFormData = z.infer<typeof leadSearchSchema>;
