package com.djtools.note;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoteMapper {

    List<Note> findAll(
            @Param("userId") Long userId,
            @Param("folderId") Long folderId,
            @Param("tagName") String tagName,
            @Param("keyword") String keyword
    );

    Note findById(@Param("id") Long id, @Param("userId") Long userId);

    int insert(Note note);

    int update(Note note);

    int updateShared(@Param("id") Long id, @Param("userId") Long userId, @Param("shared") boolean shared);

    int delete(@Param("id") Long id, @Param("userId") Long userId);

    List<Note> findLatest(@Param("userId") Long userId, @Param("limit") int limit);

    long countByUser(@Param("userId") Long userId);

    List<Note> search(@Param("userId") Long userId, @Param("keyword") String keyword);
}
