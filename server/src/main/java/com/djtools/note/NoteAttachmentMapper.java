package com.djtools.note;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoteAttachmentMapper {

    List<NoteAttachment> findByNoteId(@Param("noteId") Long noteId, @Param("userId") Long userId);

    NoteAttachment findById(@Param("id") Long id, @Param("userId") Long userId);

    int insert(NoteAttachment noteAttachment);

    int delete(@Param("id") Long id, @Param("userId") Long userId);
}
