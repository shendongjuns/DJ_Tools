package com.djtools.note;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NoteFolderRequest(
        @NotBlank(message = "文件夹名称不能为空")
        @Size(max = 64, message = "文件夹名称不能超过 64 个字符")
        String name,
        @NotNull(message = "排序值不能为空")
        @Max(value = 999, message = "排序值不能大于 999")
        Integer sortOrder
) {
}

