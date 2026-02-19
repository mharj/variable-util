import type {IPersistSerializer} from 'tachyon-drive';
import {z} from 'zod';

export const dataSchema: z.ZodObject<
	{
		_v: z.ZodLiteral<1>;
		data: z.ZodRecord<z.ZodString, z.ZodString>;
	},
	z.core.$strip
> = z.object({
	_v: z.literal(1),
	data: z.record(z.string().min(1), z.string()),
});

export type TachyonConfigStoreType = z.infer<typeof dataSchema>;

export const tachyonConfigJsonStringSerializer: IPersistSerializer<TachyonConfigStoreType, string> = {
	deserialize: (buffer: string) => JSON.parse(buffer),
	name: 'TachyonConfigJsonSerializer',
	serialize: (data: TachyonConfigStoreType) => JSON.stringify(data),
	validator: (data: TachyonConfigStoreType) => dataSchema.safeParse(data).success,
};

export const tachyonConfigJsonBufferSerializer: IPersistSerializer<TachyonConfigStoreType, Buffer> = {
	deserialize: (buffer: Buffer) => JSON.parse(buffer.toString()),
	name: 'TachyonConfigJsonBufferSerializer',
	serialize: (data: TachyonConfigStoreType) => Buffer.from(JSON.stringify(data)),
	validator: (data: TachyonConfigStoreType) => dataSchema.safeParse(data).success,
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
export const tachyonConfigJsonArrayBufferSerializer: IPersistSerializer<TachyonConfigStoreType, Uint8Array> = {
	deserialize: (buffer: Uint8Array) => JSON.parse(textDecoder.decode(buffer)),
	name: 'TachyonConfigJsonArrayBufferSerializer',
	serialize: (data: TachyonConfigStoreType) => textEncoder.encode(JSON.stringify(data)),
	validator: (data: TachyonConfigStoreType) => dataSchema.safeParse(data).success,
};
