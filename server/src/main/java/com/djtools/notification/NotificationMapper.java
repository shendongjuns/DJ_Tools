package com.djtools.notification;

import java.time.OffsetDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NotificationMapper {

    List<NotificationRecord> findLatestByUser(@Param("userId") Long userId);

    long countUnread(@Param("userId") Long userId);

    int insert(NotificationRecord notificationRecord);

    int markRead(@Param("id") Long id, @Param("userId") Long userId);

    long countExists(
            @Param("userId") Long userId,
            @Param("type") String type,
            @Param("relatedType") String relatedType,
            @Param("relatedId") Long relatedId,
            @Param("remindAt") OffsetDateTime remindAt
    );
}
