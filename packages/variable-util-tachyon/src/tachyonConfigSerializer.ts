import type {IPersistSerializer} from 'tachyon-drive';
import {z} from 'zod';

/**
 * TachyonConfigStoreType is the type for the data stored in TachyonConfigLoader, it has a version and a record of key-value pairs
 * @since v0.11.1
 */
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

/**
 * TachyonConfigStoreType is the type for the data stored in TachyonConfigLoader, it has a version and a record of key-value pairs
 * @since v0.11.1
 * @category Loaders
 */
export type TachyonConfigStoreType = z.infer<typeof dataSchema>;

/**
 * TachyonConfigJsonSerializer is an implementation of IPersistSerializer for TachyonConfigStoreType, it serializes and deserializes the data to and from JSON string
 * @since v0.11.1
 * @category Serializers
 */
export const tachyonConfigJsonStringSerializer: IPersistSerializer<TachyonConfigStoreType, string> = {
	deserialize: (buffer: string) => JSON.parse(buffer),
	name: 'TachyonConfigJsonSerializer',
	serialize: (data: TachyonConfigStoreType) => JSON.stringify(data),
	validator: (data: TachyonConfigStoreType) => dataSchema.safeParse(data).success,
};

/**
 * TachyonConfigJsonBufferSerializer is an implementation of IPersistSerializer for TachyonConfigStoreType, it serializes and deserializes the data to and from Buffer
 * @since v0.11.1
 * @category Serializers
 */
export const tachyonConfigJsonBufferSerializer: IPersistSerializer<TachyonConfigStoreType, Buffer> = {
	deserialize: (buffer: Buffer) => JSON.parse(buffer.toString()),
	name: 'TachyonConfigJsonBufferSerializer',
	serialize: (data: TachyonConfigStoreType) => Buffer.from(JSON.stringify(data)),
	validator: (data: TachyonConfigStoreType) => dataSchema.safeParse(data).success,
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
/**
 * TachyonConfigJsonArrayBufferSerializer is an implementation of IPersistSerializer for TachyonConfigStoreType, it serializes and deserializes the data to and from Uint8Array
 * @since v0.13.0
 * @category Serializers
 */
export const tachyonConfigJsonArrayBufferSerializer: IPersistSerializer<TachyonConfigStoreType, Uint8Array> = {
	deserialize: (buffer: Uint8Array) => JSON.parse(textDecoder.decode(buffer)),
	name: 'TachyonConfigJsonArrayBufferSerializer',
	serialize: (data: TachyonConfigStoreType) => textEncoder.encode(JSON.stringify(data)),
	validator: (data: TachyonConfigStoreType) => dataSchema.safeParse(data).success,
};
