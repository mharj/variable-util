import {type IPersistSerializer} from 'tachyon-drive';
import {z} from 'zod';

const dataSchema = z.object({
	_v: z.literal(1),
	data: z.record(z.string().min(1), z.string()),
});

export type TachyonConfigStoreType = z.infer<typeof dataSchema>;

export const tachyonConfigJsonStringSerializer: IPersistSerializer<TachyonConfigStoreType, string> = {
	name: 'TachyonConfigJsonSerializer',
	serialize: (data: TachyonConfigStoreType) => JSON.stringify(data),
	deserialize: (buffer: string) => JSON.parse(buffer),
	validator: (data: TachyonConfigStoreType) => dataSchema.safeParse(data).success,
};

export const tachyonConfigJsonBufferSerializer: IPersistSerializer<TachyonConfigStoreType, Buffer> = {
	name: 'TachyonConfigJsonBufferSerializer',
	serialize: (data: TachyonConfigStoreType) => Buffer.from(JSON.stringify(data)),
	deserialize: (buffer: Buffer) => JSON.parse(buffer.toString()),
	validator: (data: TachyonConfigStoreType) => dataSchema.safeParse(data).success,
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
export const tachyonConfigJsonArrayBufferSerializer: IPersistSerializer<TachyonConfigStoreType, Uint8Array> = {
	name: 'TachyonConfigJsonArrayBufferSerializer',
	serialize: (data: TachyonConfigStoreType) => textEncoder.encode(JSON.stringify(data)),
	deserialize: (buffer: Uint8Array) => JSON.parse(textDecoder.decode(buffer)),
	validator: (data: TachyonConfigStoreType) => dataSchema.safeParse(data).success,
};
