import { z } from 'zod';

// Validation schema for user queries
export const UserQuerySchema = z.object({
  brand: z.string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name too long (maximum 100 characters)')
    .trim(),
  
  product: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name too long (maximum 200 characters)')
    .trim(),
  
  issue: z.string()
    .min(20, 'Issue description too short (minimum 20 characters)')
    .max(2000, 'Issue description too long (maximum 2000 characters)')
    .trim(),
  
  city: z.string()
    .max(100, 'City name too long')
    .trim()
    .optional(),
  
  state: z.string()
    .max(100, 'State name too long')
    .trim()
    .optional(),
});

export type UserQueryInput = z.infer<typeof UserQuerySchema>;

// Validation schema for feedback
export const FeedbackSchema = z.object({
  queryId: z.string()
    .uuid('Invalid query ID format'),
  
  wasHelpful: z.boolean()
    .optional(),
  
  feedback: z.string()
    .max(1000, 'Feedback too long (maximum 1000 characters)')
    .trim()
    .optional(),
});

export type FeedbackInput = z.infer<typeof FeedbackSchema>;
