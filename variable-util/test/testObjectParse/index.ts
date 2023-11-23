import {SemicolonConfigParser} from '../../src/parsers/SemicolonConfigParser';
import {z} from 'zod';

/**
 * transform string 'true' | 'false' as boolean
 */
export const booleanParamSchema = z.enum(['true', 'false']).transform((value) => value === 'true');

export const testObjectFinalSchema = z.object({
	First: z.boolean(),
	Second: z.boolean(),
	Third: z.boolean(),
});

type TestObjectRawType = {
	First: 'true' | 'false';
	Second: 'true' | 'false';
	Third: 'true' | 'false';
};

const testObjectSchema = z.object({
	First: booleanParamSchema.optional().default('false'),
	Second: booleanParamSchema.optional().default('false'),
	Third: booleanParamSchema.optional().default('false'),
});

export type TestObjectType = z.infer<typeof testObjectSchema>;

export const testObjectParser = new SemicolonConfigParser<TestObjectType, TestObjectRawType>({
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	validate: (data) => testObjectSchema.parseAsync(data),
});
