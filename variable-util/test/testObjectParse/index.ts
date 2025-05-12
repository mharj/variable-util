import {z} from 'zod';
import {SemicolonConfigParser} from '../../src/parsers/SemicolonConfigParser';

/**
 * transform string 'true' | 'false' as boolean
 * @since v1.0.0
 */
export const booleanParamSchema = z.enum(['true', 'false']).transform((value) => value === 'true');

export const testObjectFinalSchema = z.object({
	First: z.boolean(),
	Second: z.boolean(),
	Third: z.boolean(),
});

const testObjectSchema = z.object({
	First: booleanParamSchema.optional().default('false'),
	Second: booleanParamSchema.optional().default('false'),
	Third: booleanParamSchema.optional().default('false'),
});

export type TestObjectType = z.infer<typeof testObjectSchema>;

export const testObjectParser = new SemicolonConfigParser({
	validate: (data) => testObjectSchema.parseAsync(data),
});
