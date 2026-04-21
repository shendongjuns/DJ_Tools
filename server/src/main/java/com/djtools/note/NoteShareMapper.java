package com.djtools.note;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoteShareMapper {

    int insert(NoteShare noteShare);

    List<NoteShare> findByNoteId(@Param("noteId") Long noteId, @Param("userId") Long userId);

    long countActiveByNoteId(@Param("noteId") Long noteId, @Param("userId") Long userId);

    NoteShare findActiveByToken(@Param("token") String token);

    int disable(@Param("id") Long id, @Param("userId") Long userId);
}
