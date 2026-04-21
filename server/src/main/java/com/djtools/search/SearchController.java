package com.djtools.search;

import com.djtools.common.ApiResponse;
import com.djtools.security.SecurityUtils;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public ApiResponse<List<SearchResultResponse>> search(
            @RequestParam(defaultValue = "all") String scope,
            @RequestParam String keyword
    ) {
        return ApiResponse.success(searchService.search(SecurityUtils.currentUser(), scope, keyword));
    }
}

