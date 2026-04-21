package com.djtools.note;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoteFolderMapper {

    List<NoteFolder> findAllByUser(@Param("userId") Long userId);

    NoteFolder findById(@Param("id") Long id, @Param("userId") Long userId);

    int insert(NoteFolder noteFolder);
}
