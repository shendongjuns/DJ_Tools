package com.djtools.note;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoteTagRelationMapper {

    int deleteByNoteId(@Param("noteId") Long noteId);

    int insert(@Param("noteId") Long noteId, @Param("tagId") Long tagId);
}
