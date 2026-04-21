package com.djtools.note;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record NoteRequest(
        Long folderId,
        @NotBlank(message = "笔记标题不能为空")
        @Size(max = 160, message = "笔记标题不能超过 160 个字符")
        String title,
        @Size(max = 255, message = "摘要不能超过 255 个字符")
        String summary,
        @NotBlank(message = "笔记正文不能为空")
        String content,
        List<String> tags
) {
}

