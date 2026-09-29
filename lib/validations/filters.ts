import { z } from 'zod';

export const jobFiltersSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const leadFiltersSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  website_status: z.enum(['all', 'with_website', 'no_website']).default('all'),
  seo_opportunity: z.boolean().optional(),
  social_opportunity: z.boolean().optional(),
  priority: z.enum(['all', 'high', 'medium', 'low']).default('all'),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const opportunityFiltersSchema = z.object({
  type: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  hasWhatsapp: z.boolean().optional(),
  companyId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
