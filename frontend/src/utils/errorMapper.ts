
import messages from "@/utils/messages";


type ServerError = any;


/**
* Map common server error shapes (Joi or custom) to a field->message map.
* Returns an object where keys are field names (or 'global') and values are user-facing messages.
*/
export function mapServerErrors(serverData: ServerError): Record<string, string> {
    const out: Record<string, string> = {};
    if (!serverData) return out;


    // Case A: { errors: { field: 'message' } }
    if (serverData.errors && typeof serverData.errors === "object") {
        Object.keys(serverData.errors).forEach((k) => {
            const raw = serverData.errors[k];
            out[k] = mapKnownServerMessage(raw);
        });
        return out;
    }


    // Case B: Joi-like details: { details: [ { message, path }, ... ] }
    if (Array.isArray(serverData.details)) {
        serverData.details.forEach((d: any) => {
            const key = d.path?.[0] ?? "global";
            out[key] = mapKnownServerMessage(d.message);
        });
        return out;
    }


    // Case C: { field: 'email', message: '...' }
    if (serverData.field && serverData.message) {
        out[serverData.field] = mapKnownServerMessage(serverData.message);
        return out;
    }


    // Case D: single message
    if (serverData.message) {
        out.global = mapKnownServerMessage(serverData.message);
        return out;
    }


    return out;
}


/**
* Try to map raw server message text to a canonical frontend message.
* If no mapping found, return the original server message.
*/
function mapKnownServerMessage(raw: string): string {
    if (!raw) return messages.ERROR.SERVER_ERROR;
    const normalized = String(raw).trim();


    // Exact matches
    if (normalized === "Email already exists" || normalized === "EMAIL_EXISTS") return messages.ERROR.EMAIL_EXISTS;
    if (normalized === "Please fill all required fields") return messages.ERROR.REQUIRED_FIELDS;
    if (normalized.includes("must be at least 10")) return messages.ERROR.PHONE_MIN;
    if (normalized.includes("Password must be 8-16")) return messages.ERROR.PASSWORD_INVALID;
    if (normalized.includes("Name must contain")) return messages.ERROR.NAME_INVALID;
    if (normalized.includes("Role must be") || normalized.includes("Role is required")) return messages.ERROR.ROLE_INVALID;


    // Return raw message as fallback so user sees something helpful
    return normalized;
}