package com.djtools.note;

import com.djtools.common.ApiException;
import com.djtools.config.MinioProperties;
import com.djtools.security.CurrentUser;
import io.minio.GetObjectArgs;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.MinioClient;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class NoteService {

    private final NoteFolderMapper noteFolderMapper;
    private final NoteTagMapper noteTagMapper;
    private final NoteTagRelationMapper noteTagRelationMapper;
    private final NoteMapper noteMapper;
    private final NoteAttachmentMapper noteAttachmentMapper;
    private final NoteShareMapper noteShareMapper;
    private final MinioClient minioClient;
    private final MinioProperties minioProperties;

    public NoteService(
            NoteFolderMapper noteFolderMapper,
            NoteTagMapper noteTagMapper,
            NoteTagRelationMapper noteTagRelationMapper,
            NoteMapper noteMapper,
            NoteAttachmentMapper noteAttachmentMapper,
            NoteShareMapper noteShareMapper,
            MinioClient minioClient,
            MinioProperties minioProperties
    ) {
        this.noteFolderMapper = noteFolderMapper;
        this.noteTagMapper = noteTagMapper;
        this.noteTagRelationMapper = noteTagRelationMapper;
        this.noteMapper = noteMapper;
        this.noteAttachmentMapper = noteAttachmentMapper;
        this.noteShareMapper = noteShareMapper;
        this.minioClient = minioClient;
        this.minioProperties = minioProperties;
    }

    public List<NoteFolderResponse> listFolders(CurrentUser currentUser) {
        return noteFolderMapper.findAllByUser(currentUser.getId())
                .stream()
                .map(folder -> new NoteFolderResponse(folder.getId(), folder.getName(), folder.getSortOrder()))
                .toList();
    }

    @Transactional
    public NoteFolderResponse createFolder(CurrentUser currentUser, NoteFolderRequest request) {
        NoteFolder noteFolder = new NoteFolder();
        noteFolder.setUserId(currentUser.getId());
        noteFolder.setName(request.name());
        noteFolder.setSortOrder(request.sortOrder());
        noteFolderMapper.insert(noteFolder);
        return new NoteFolderResponse(noteFolder.getId(), noteFolder.getName(), noteFolder.getSortOrder());
    }

    public List<String> listTags(CurrentUser currentUser) {
        return noteTagMapper.findAllByUser(currentUser.getId()).stream().map(NoteTag::getName).toList();
    }

    public List<NoteListItemResponse> listNotes(CurrentUser currentUser, Long folderId, String tag, String keyword) {
        return noteMapper.findAll(currentUser.getId(), folderId, tag, keyword)
                .stream()
                .map(note -> new NoteListItemResponse(
                        note.getId(),
                        note.getTitle(),
                        note.getSummary(),
                        note.getFolderId(),
                        note.getFolderName(),
                        noteTagMapper.findByNoteId(note.getId()).stream().map(NoteTag::getName).toList(),
                        note.isShared(),
                        note.getCreatedAt(),
                        note.getUpdatedAt()
                ))
                .toList();
    }

    @Transactional
    public NoteDetailResponse createNote(CurrentUser currentUser, NoteRequest request) {
        if (request.folderId() != null) {
            requireFolder(currentUser.getId(), request.folderId());
        }
        Note note = new Note();
        note.setUserId(currentUser.getId());
        note.setFolderId(request.folderId());
        note.setTitle(request.title());
        note.setSummary(request.summary());
        note.setContent(request.content());
        note.setShared(false);
        noteMapper.insert(note);
        syncTags(currentUser.getId(), note.getId(), request.tags());
        return getNote(currentUser, note.getId());
    }

    @Transactional
    public NoteDetailResponse updateNote(CurrentUser currentUser, Long id, NoteRequest request) {
        Note note = requireNote(currentUser.getId(), id);
        if (request.folderId() != null) {
            requireFolder(currentUser.getId(), request.folderId());
        }
        note.setFolderId(request.folderId());
        note.setTitle(request.title());
        note.setSummary(request.summary());
        note.setContent(request.content());
        noteMapper.update(note);
        syncTags(currentUser.getId(), note.getId(), request.tags());
        return getNote(currentUser, id);
    }

    public NoteDetailResponse getNote(CurrentUser currentUser, Long id) {
        Note note = requireNote(currentUser.getId(), id);
        return toDetail(currentUser.getId(), note);
    }

    @Transactional
    public void deleteNote(CurrentUser currentUser, Long id) {
        requireNote(currentUser.getId(), id);
        noteMapper.delete(id, currentUser.getId());
    }

    public List<NoteAttachmentResponse> listAttachments(CurrentUser currentUser, Long noteId) {
        requireNote(currentUser.getId(), noteId);
        return noteAttachmentMapper.findByNoteId(noteId, currentUser.getId()).stream().map(this::toAttachmentResponse).toList();
    }

    public NoteAttachment findAttachment(CurrentUser currentUser, Long attachmentId) {
        NoteAttachment attachment = noteAttachmentMapper.findById(attachmentId, currentUser.getId());
        if (attachment == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "附件不存在");
        }
        return attachment;
    }

    public InputStream openAttachment(CurrentUser currentUser, Long attachmentId) {
        NoteAttachment attachment = findAttachment(currentUser, attachmentId);
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(minioProperties.getBucket())
                            .object(attachment.getObjectName())
                            .build()
            );
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "附件读取失败: " + exception.getMessage());
        }
    }

    @Transactional
    public NoteAttachmentResponse uploadAttachment(CurrentUser currentUser, Long noteId, MultipartFile file) {
        requireNote(currentUser.getId(), noteId);
        try (InputStream inputStream = file.getInputStream()) {
            String objectName = "note/" + noteId + "/" + UUID.randomUUID() + "-" + file.getOriginalFilename();
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioProperties.getBucket())
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            NoteAttachment attachment = new NoteAttachment();
            attachment.setNoteId(noteId);
            attachment.setUserId(currentUser.getId());
            attachment.setObjectName(objectName);
            attachment.setOriginalFilename(file.getOriginalFilename());
            attachment.setContentType(file.getContentType());
            attachment.setSizeBytes(file.getSize());
            noteAttachmentMapper.insert(attachment);
            return toAttachmentResponse(noteAttachmentMapper.findById(attachment.getId(), currentUser.getId()));
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "附件上传失败: " + exception.getMessage());
        }
    }

    @Transactional
    public void deleteAttachment(CurrentUser currentUser, Long attachmentId) {
        NoteAttachment attachment = noteAttachmentMapper.findById(attachmentId, currentUser.getId());
        if (attachment == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "附件不存在");
        }
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(minioProperties.getBucket())
                            .object(attachment.getObjectName())
                            .build()
            );
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "附件删除失败: " + exception.getMessage());
        }
        noteAttachmentMapper.delete(attachmentId, currentUser.getId());
    }

    @Transactional
    public NoteShareResponse createShare(CurrentUser currentUser, Long noteId, NoteShareRequest request, String baseUrl) {
        Note note = requireNote(currentUser.getId(), noteId);
        NoteShare noteShare = new NoteShare();
        noteShare.setNoteId(noteId);
        noteShare.setUserId(currentUser.getId());
        noteShare.setShareToken(UUID.randomUUID().toString().replace("-", ""));
        noteShare.setExpiresAt(resolveExpireTime(request.expireOption()));
        noteShare.setDisabled(false);
        noteShareMapper.insert(noteShare);
        noteMapper.updateShared(noteId, currentUser.getId(), true);
        note.setShared(true);
        return toShareResponse(noteShare, baseUrl);
    }

    @Transactional
    public NoteShareResponse updateShare(CurrentUser currentUser, Long shareId, NoteShareRequest request) {
        NoteShare noteShare = noteShareMapper.findById(shareId, currentUser.getId());
        if (noteShare == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "分享链接不存在");
        }
        noteShareMapper.updateExpiresAt(shareId, currentUser.getId(), resolveExpireTime(request.expireOption()));
        NoteShare updated = noteShareMapper.findById(shareId, currentUser.getId());
        noteMapper.updateShared(updated.getNoteId(), currentUser.getId(), noteShareMapper.countActiveByNoteId(updated.getNoteId(), currentUser.getId()) > 0);
        return toShareResponse(updated, "");
    }

    @Transactional
    public void deleteShare(CurrentUser currentUser, Long shareId) {
        NoteShare noteShare = noteShareMapper.findById(shareId, currentUser.getId());
        if (noteShare == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "分享链接不存在");
        }
        noteShareMapper.delete(shareId, currentUser.getId());
        noteMapper.updateShared(noteShare.getNoteId(), currentUser.getId(), noteShareMapper.countActiveByNoteId(noteShare.getNoteId(), currentUser.getId()) > 0);
    }

    public SharedNoteResponse getSharedNote(String token) {
        NoteShare noteShare = noteShareMapper.findActiveByToken(token);
        if (noteShare == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "分享链接不存在或已失效");
        }
        Note note = requireNote(noteShare.getUserId(), noteShare.getNoteId());
        return new SharedNoteResponse(
                note.getTitle(),
                note.getSummary(),
                note.getContent(),
                note.getFolderName(),
                noteTagMapper.findByNoteId(note.getId()).stream().map(NoteTag::getName).toList(),
                note.getUpdatedAt()
        );
    }

    public List<NoteListItemResponse> latest(CurrentUser currentUser, int limit) {
        return noteMapper.findLatest(currentUser.getId(), limit).stream()
                .map(note -> new NoteListItemResponse(
                        note.getId(),
                        note.getTitle(),
                        note.getSummary(),
                        note.getFolderId(),
                        note.getFolderName(),
                        noteTagMapper.findByNoteId(note.getId()).stream().map(NoteTag::getName).toList(),
                        note.isShared(),
                        note.getCreatedAt(),
                        note.getUpdatedAt()
                ))
                .toList();
    }

    public long count(CurrentUser currentUser) {
        return noteMapper.countByUser(currentUser.getId());
    }

    private void syncTags(Long userId, Long noteId, List<String> tags) {
        noteTagRelationMapper.deleteByNoteId(noteId);
        if (tags == null) {
            return;
        }
        for (String tagName : tags.stream().map(String::trim).filter(value -> !value.isBlank()).distinct().toList()) {
            NoteTag noteTag = noteTagMapper.findByName(userId, tagName);
            if (noteTag == null) {
                noteTag = new NoteTag();
                noteTag.setUserId(userId);
                noteTag.setName(tagName);
                noteTagMapper.insert(noteTag);
                noteTag = noteTagMapper.findByName(userId, tagName);
            }
            noteTagRelationMapper.insert(noteId, noteTag.getId());
        }
    }

    private OffsetDateTime resolveExpireTime(String expireOption) {
        return switch (expireOption) {
            case "ONE_DAY" -> OffsetDateTime.now().plusDays(1);
            case "SEVEN_DAYS" -> OffsetDateTime.now().plusDays(7);
            case "THIRTY_DAYS" -> OffsetDateTime.now().plusDays(30);
            case "PERMANENT" -> null;
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "不支持的分享时效");
        };
    }

    private Note requireNote(Long userId, Long noteId) {
        Note note = noteMapper.findById(noteId, userId);
        if (note == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "笔记不存在");
        }
        return note;
    }

    private NoteFolder requireFolder(Long userId, Long folderId) {
        NoteFolder folder = noteFolderMapper.findById(folderId, userId);
        if (folder == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "笔记文件夹不存在");
        }
        return folder;
    }

    private NoteDetailResponse toDetail(Long userId, Note note) {
        List<NoteAttachmentResponse> attachments = noteAttachmentMapper.findByNoteId(note.getId(), userId).stream()
                .map(this::toAttachmentResponse)
                .toList();
        List<NoteShareResponse> shares = new ArrayList<>();
        for (NoteShare noteShare : noteShareMapper.findByNoteId(note.getId(), userId)) {
            shares.add(toShareResponse(noteShare, ""));
        }
        return new NoteDetailResponse(
                note.getId(),
                note.getTitle(),
                note.getSummary(),
                note.getContent(),
                note.getFolderId(),
                note.getFolderName(),
                noteTagMapper.findByNoteId(note.getId()).stream().map(NoteTag::getName).toList(),
                attachments,
                shares,
                note.isShared(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }

    private NoteAttachmentResponse toAttachmentResponse(NoteAttachment attachment) {
        return new NoteAttachmentResponse(
                attachment.getId(),
                attachment.getOriginalFilename(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                attachment.getCreatedAt()
        );
    }

    private NoteShareResponse toShareResponse(NoteShare noteShare, String baseUrl) {
        String shareUrl = (baseUrl == null || baseUrl.isBlank())
                ? "/share/notes/" + noteShare.getShareToken()
                : baseUrl + "/share/notes/" + noteShare.getShareToken();
        return new NoteShareResponse(
                noteShare.getId(),
                noteShare.getShareToken(),
                shareUrl,
                noteShare.getExpiresAt(),
                noteShare.isDisabled()
        );
    }
}
