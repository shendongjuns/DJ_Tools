package com.djtools.note;

import jakarta.validation.constraints.NotBlank;

public record NoteShareRequest(
        @NotBlank(message = "分享时效不能为空")
        String expireOption
) {
}

