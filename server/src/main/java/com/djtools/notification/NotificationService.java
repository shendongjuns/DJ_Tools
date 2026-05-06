package com.djtools.notification;

import com.djtools.security.CurrentUser;
import com.djtools.todo.TodoItem;
import com.djtools.todo.TodoMapper;
import com.djtools.user.UserAccountMapper;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final TodoMapper todoMapper;
    private final UserAccountMapper userAccountMapper;

    public NotificationService(
            NotificationMapper notificationMapper,
            TodoMapper todoMapper,
            UserAccountMapper userAccountMapper
    ) {
        this.notificationMapper = notificationMapper;
        this.todoMapper = todoMapper;
        this.userAccountMapper = userAccountMapper;
    }

    public NotificationListResponse list(CurrentUser currentUser) {
        List<NotificationResponse> items = notificationMapper.findLatestByUser(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
        return new NotificationListResponse(notificationMapper.countUnread(currentUser.getId()), items);
    }

    @Transactional
    public void markRead(CurrentUser currentUser, Long id) {
        notificationMapper.markRead(id, currentUser.getId());
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void generateTodoReminders() {
        Long adminUserId = userAccountMapper.findFirstUserId();
        if (adminUserId == null) {
            return;
        }
        for (TodoItem todoItem : todoMapper.findNeedReminder(adminUserId)) {
            long exists = notificationMapper.countExists(
                    adminUserId,
                    "TODO_REMINDER",
                    "TODO",
                    todoItem.getId(),
                    todoItem.getRemindAt()
            );
            if (exists > 0) {
                continue;
            }
            NotificationRecord notificationRecord = new NotificationRecord();
            notificationRecord.setUserId(adminUserId);
            notificationRecord.setType("TODO_REMINDER");
            notificationRecord.setTitle("待办提醒");
            notificationRecord.setContent("任务《" + todoItem.getTitle() + "》已到提醒时间");
            notificationRecord.setRelatedType("TODO");
            notificationRecord.setRelatedId(todoItem.getId());
            notificationRecord.setRemindAt(todoItem.getRemindAt());
            notificationRecord.setReadFlag(false);
            notificationMapper.insert(notificationRecord);
        }
    }

    private NotificationResponse toResponse(NotificationRecord notificationRecord) {
        return new NotificationResponse(
                notificationRecord.getId(),
                notificationRecord.getType(),
                notificationRecord.getTitle(),
                notificationRecord.getContent(),
                notificationRecord.getRelatedType(),
                notificationRecord.getRelatedId(),
                notificationRecord.getRemindAt(),
                notificationRecord.isReadFlag(),
                notificationRecord.getCreatedAt()
        );
    }
}
