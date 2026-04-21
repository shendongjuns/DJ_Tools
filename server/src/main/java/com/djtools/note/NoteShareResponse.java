package com.djtools.note;

import java.time.OffsetDateTime;

public record NoteShareResponse(
        Long id,
        String shareToken,
        String shareUrl,
        OffsetDateTime expiresAt,
        boolean disabled
) {
}

