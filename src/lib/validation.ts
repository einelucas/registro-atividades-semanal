import { z } from 'zod';
export const activitySchema=z.object({personId:z.string().uuid().optional(),unitId:z.string().uuid(),categoryId:z.string().uuid(),date:z.iso.date(),description:z.string().trim().min(1).max(300),status:z.enum(['DONE','IN_PROGRESS'])}).strict();
