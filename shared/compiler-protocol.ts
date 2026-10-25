// Old tabs only accept successful rows. Negotiate failed rows explicitly so a
// rolling deployment never sends them a shape their Zod schema cannot read.
export const COMPILER_PROTOCOL_HEADER = 'x-compiler-protocol';
export const COMPILER_PROTOCOL = 'per-message-v1';
