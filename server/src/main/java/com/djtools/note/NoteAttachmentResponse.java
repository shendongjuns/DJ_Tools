package com.djtools.note;

import java.time.OffsetDateTime;

public record NoteAttachmentResponse(
        Long id,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        OffsetDateTime createdAt
) {
}

