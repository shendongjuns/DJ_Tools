package com.djtools.note;

import java.time.OffsetDateTime;
import java.util.List;

public record SharedNoteResponse(
        String title,
        String summary,
        String content,
        String folderName,
        List<String> tags,
        OffsetDateTime updatedAt
) {
}

