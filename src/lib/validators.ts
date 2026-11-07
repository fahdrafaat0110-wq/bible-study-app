
import { z } from 'zod';

/**
 * Server-side validation for every mutation.
 * All values are trimmed and length-checked to prevent blank records.
 */

// A phone number is digits only, with an optional leading + and spaces.
const phoneRegex = /^[\d\s()+-]{7,20}$/;

export const createMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'الاسم يجب أن يكون على الأقل حرفين')
    .max(120, 'الاسم طويل جدًا'),
  phoneNumber: z
    .string()
    .trim()
    .regex(phoneRegex, 'رقم الهاتف غير صحيح'),
  dateOfBirth: z
    .string()
    .date(' تاريخ الميلاد غير صحيح')
    .refine((d) => {
      const date = new Date(d);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      const hadBirthdayThisYear =
        now.getMonth() > date.getMonth() ||
        (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
      return age - (hadBirthdayThisYear ? 0 : 1) <= 120;
    }, ' تاريخ الميلاد غير صحيح'),
  college: z.string().trim().min(1, 'الكلية مطلوبة').max(120, 'الكلية طويلة جدًا'),
});

export const updateMemberSchema = createMemberSchema;

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1, 'عنوان Meeting مطلوب').max(160, 'العنوان طويل جدًا'),
  meetingDate: z.string().date(' تاريخ Meeting غير صحيح'),
});

export const activityPatchSchema = z.object({
  memberId: z.string().min(1),
  meetingId: z.string().min(1),

  attendance: z.boolean().optional(),
  bibleReading: z.boolean().optional(),
  spiritualNote: z.boolean().optional(),
  preparation: z.boolean().optional(),
}).refine(
  (v) =>
    v.attendance !== undefined ||
    v.bibleReading !== undefined ||
    v.spiritualNote !== undefined ||
    v.preparation !== undefined,
  { message: 'No activity field provided' },
);

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type ActivityPatchInput = z.infer<typeof activityPatchSchema>;
