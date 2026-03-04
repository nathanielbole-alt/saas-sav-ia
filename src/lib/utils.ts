import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function toRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null
    }

    return value as Record<string, unknown>
}

export function extractGmailReplyContext(metadata: unknown): {
    threadId: string | null
    inReplyToMessageId: string | null
} {
    const metadataRecord = toRecord(metadata)
    if (!metadataRecord) {
        return { threadId: null, inReplyToMessageId: null }
    }

    const threadId =
        typeof metadataRecord.gmail_thread_id === 'string'
            ? metadataRecord.gmail_thread_id
            : null

    const inReplyToMessageId =
        typeof metadataRecord.gmail_message_id_header === 'string'
            ? metadataRecord.gmail_message_id_header
            : typeof metadataRecord.in_reply_to_message_id === 'string'
                ? metadataRecord.in_reply_to_message_id
                : typeof metadataRecord.message_id === 'string'
                    ? metadataRecord.message_id
                    : null

    return { threadId, inReplyToMessageId }
}

export function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diffMs / 60000)

    if (mins < 1) return "à l'instant"
    if (mins < 60) return `${mins}m`

    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`

    const days = Math.floor(hrs / 24)
    return `${days}j`
}

export function getCustomerName(customer: {
    full_name: string | null
    email: string
}): string {
    return customer.full_name ?? customer.email
}
