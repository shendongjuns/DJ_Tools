package com.djtools.note;

import java.time.OffsetDateTime;
import java.util.List;

public record NoteListItemResponse(
        Long id,
        String title,
        String summary,
        Long folderId,
        String folderName,
        List<String> tags,
        boolean shared,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}

