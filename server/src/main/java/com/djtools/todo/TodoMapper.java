package com.djtools.todo;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TodoMapper {

    List<TodoItem> findAllByUser(@Param("userId") Long userId, @Param("keyword") String keyword);

    TodoItem findById(@Param("id") Long id, @Param("userId") Long userId);

    int insert(TodoItem todoItem);

    int update(TodoItem todoItem);

    int updateStatus(TodoItem todoItem);

    int softDelete(@Param("id") Long id, @Param("userId") Long userId);

    List<TodoItem> findNeedReminder(@Param("userId") Long userId);

    List<TodoItem> findLatest(@Param("userId") Long userId, @Param("limit") int limit);

    long countUnfinished(@Param("userId") Long userId);

    List<TodoItem> search(@Param("userId") Long userId, @Param("keyword") String keyword);
}
