package com.djtools.note;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoteTagMapper {

    List<NoteTag> findAllByUser(@Param("userId") Long userId);

    NoteTag findByName(@Param("userId") Long userId, @Param("name") String name);

    int insert(NoteTag noteTag);

    List<NoteTag> findByNoteId(@Param("noteId") Long noteId);
}
