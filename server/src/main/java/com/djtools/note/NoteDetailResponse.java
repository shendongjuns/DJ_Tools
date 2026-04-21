package com.djtools.note;

import java.time.OffsetDateTime;
import java.util.List;

public record NoteDetailResponse(
        Long id,
        String title,
        String summary,
        String content,
        Long folderId,
        String folderName,
        List<String> tags,
        List<NoteAttachmentResponse> attachments,
        List<NoteShareResponse> shares,
        boolean shared,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}

