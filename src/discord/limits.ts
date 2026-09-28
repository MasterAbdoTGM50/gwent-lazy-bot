/** Discord's message and embed limits (https://discord.com/developers/docs/resources/message#embed-object-embed-limits). */
export const EMBED_DESCRIPTION_LIMIT = 4096;
export const EMBED_FIELD_VALUE_LIMIT = 1024;
export const EMBEDS_PER_MESSAGE = 10;
/** Total characters across every embed in one message. */
export const EMBED_CHARS_PER_MESSAGE = 6000;

/** Discord rejects empty field names and values; a zero-width space renders as nothing. */
export const BLANK = "​";

/** Shortens text to at most `limit` characters, marking the cut with an ellipsis. */
export function truncate(text: string, limit: number): string {
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}
