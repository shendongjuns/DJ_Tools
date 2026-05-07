package com.djtools.note;

import java.time.OffsetDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoteShareMapper {

    int insert(NoteShare noteShare);

    List<NoteShare> findByNoteId(@Param("noteId") Long noteId, @Param("userId") Long userId);

    long countActiveByNoteId(@Param("noteId") Long noteId, @Param("userId") Long userId);

    NoteShare findById(@Param("id") Long id, @Param("userId") Long userId);

    NoteShare findActiveByToken(@Param("token") String token);

    int updateExpiresAt(@Param("id") Long id, @Param("userId") Long userId, @Param("expiresAt") OffsetDateTime expiresAt);

    int delete(@Param("id") Long id, @Param("userId") Long userId);
}
