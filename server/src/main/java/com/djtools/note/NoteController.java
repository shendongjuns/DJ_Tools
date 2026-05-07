package com.djtools.note;

import com.djtools.common.ApiResponse;
import com.djtools.security.SecurityUtils;
import jakarta.validation.Valid;
import java.io.InputStream;
import java.util.List;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping("/api/note-folders")
    public ApiResponse<List<NoteFolderResponse>> listFolders() {
        return ApiResponse.success(noteService.listFolders(SecurityUtils.currentUser()));
    }

    @PostMapping("/api/note-folders")
    public ApiResponse<NoteFolderResponse> createFolder(@Valid @RequestBody NoteFolderRequest request) {
        return ApiResponse.success(noteService.createFolder(SecurityUtils.currentUser(), request), "文件夹已创建");
    }

    @GetMapping("/api/note-tags")
    public ApiResponse<List<String>> listTags() {
        return ApiResponse.success(noteService.listTags(SecurityUtils.currentUser()));
    }

    @GetMapping("/api/notes")
    public ApiResponse<List<NoteListItemResponse>> listNotes(
            @RequestParam(required = false) Long folderId,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(noteService.listNotes(SecurityUtils.currentUser(), folderId, tag, keyword));
    }

    @PostMapping("/api/notes")
    public ApiResponse<NoteDetailResponse> createNote(@Valid @RequestBody NoteRequest request) {
        return ApiResponse.success(noteService.createNote(SecurityUtils.currentUser(), request), "笔记已创建");
    }

    @GetMapping("/api/notes/{id}")
    public ApiResponse<NoteDetailResponse> getNote(@PathVariable Long id) {
        return ApiResponse.success(noteService.getNote(SecurityUtils.currentUser(), id));
    }

    @PutMapping("/api/notes/{id}")
    public ApiResponse<NoteDetailResponse> updateNote(@PathVariable Long id, @Valid @RequestBody NoteRequest request) {
        return ApiResponse.success(noteService.updateNote(SecurityUtils.currentUser(), id, request), "笔记已更新");
    }

    @DeleteMapping("/api/notes/{id}")
    public ApiResponse<Void> deleteNote(@PathVariable Long id) {
        noteService.deleteNote(SecurityUtils.currentUser(), id);
        return ApiResponse.success(null, "笔记已删除");
    }

    @GetMapping("/api/notes/{id}/attachments")
    public ApiResponse<List<NoteAttachmentResponse>> listAttachments(@PathVariable Long id) {
        return ApiResponse.success(noteService.listAttachments(SecurityUtils.currentUser(), id));
    }

    @PostMapping("/api/notes/{id}/attachments")
    public ApiResponse<NoteAttachmentResponse> uploadAttachment(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return ApiResponse.success(noteService.uploadAttachment(SecurityUtils.currentUser(), id, file), "附件已上传");
    }

    @GetMapping("/api/note-attachments/{id}/content")
    public ResponseEntity<InputStreamResource> getAttachmentContent(@PathVariable Long id) {
        NoteAttachment attachment = noteService.findAttachment(SecurityUtils.currentUser(), id);
        InputStream inputStream = noteService.openAttachment(SecurityUtils.currentUser(), id);
        MediaType mediaType = attachment.getContentType() == null || attachment.getContentType().isBlank()
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(attachment.getContentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.getOriginalFilename() + "\"")
                .body(new InputStreamResource(inputStream));
    }

    @DeleteMapping("/api/note-attachments/{id}")
    public ApiResponse<Void> deleteAttachment(@PathVariable Long id) {
        noteService.deleteAttachment(SecurityUtils.currentUser(), id);
        return ApiResponse.success(null, "附件已删除");
    }

    @PostMapping("/api/notes/{id}/share")
    public ApiResponse<NoteShareResponse> createShare(
            @PathVariable Long id,
            @Valid @RequestBody NoteShareRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String baseUrl = httpServletRequest.getScheme() + "://" + httpServletRequest.getServerName()
                + (httpServletRequest.getServerPort() == 80 || httpServletRequest.getServerPort() == 443
                ? ""
                : ":" + httpServletRequest.getServerPort());
        return ApiResponse.success(noteService.createShare(SecurityUtils.currentUser(), id, request, baseUrl), "分享链接已生成");
    }

    @PutMapping("/api/note-shares/{id}")
    public ApiResponse<NoteShareResponse> updateShare(@PathVariable Long id, @Valid @RequestBody NoteShareRequest request) {
        return ApiResponse.success(noteService.updateShare(SecurityUtils.currentUser(), id, request), "分享时效已更新");
    }

    @DeleteMapping("/api/note-shares/{id}")
    public ApiResponse<Void> deleteShare(@PathVariable Long id) {
        noteService.deleteShare(SecurityUtils.currentUser(), id);
        return ApiResponse.success(null, "分享链接已删除");
    }

    @GetMapping("/api/share/notes/{token}")
    public ApiResponse<SharedNoteResponse> getSharedNote(@PathVariable String token) {
        return ApiResponse.success(noteService.getSharedNote(token));
    }
}

