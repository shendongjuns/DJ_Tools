package com.djtools.search;

import java.util.Map;

public record SearchResultResponse(
        String scope,
        String type,
        String title,
        String snippet,
        Long targetId,
        Map<String, Object> extraMeta
) {
}

