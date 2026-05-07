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
    private final NotificationStreamService notificationStreamService;

    public NotificationService(
            NotificationMapper notificationMapper,
            TodoMapper todoMapper,
            UserAccountMapper userAccountMapper,
            NotificationStreamService notificationStreamService
    ) {
        this.notificationMapper = notificationMapper;
        this.todoMapper = todoMapper;
        this.userAccountMapper = userAccountMapper;
        this.notificationStreamService = notificationStreamService;
    }

    @Transactional
    public NotificationListResponse list(CurrentUser currentUser) {
        generateTodoRemindersForUser(currentUser.getId());
        List<NotificationResponse> items = notificationMapper.findLatestByUser(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
        return new NotificationListResponse(notificationMapper.countUnread(currentUser.getId()), items);
    }

    @Transactional
    public void markRead(CurrentUser currentUser, Long id) {
        notificationMapper.markRead(id, currentUser.getId());
        notificationStreamService.publishChanged(currentUser.getId());
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void generateTodoReminders() {
        Long adminUserId = userAccountMapper.findFirstUserId();
        if (adminUserId == null) {
            return;
        }
        generateTodoRemindersForUser(adminUserId);
    }

    private void generateTodoRemindersForUser(Long userId) {
        for (TodoItem todoItem : todoMapper.findNeedReminder(userId)) {
            long exists = notificationMapper.countExists(
                    userId,
                    "TODO_REMINDER",
                    "TODO",
                    todoItem.getId(),
                    todoItem.getRemindAt()
            );
            if (exists > 0) {
                continue;
            }
            NotificationRecord notificationRecord = new NotificationRecord();
            notificationRecord.setUserId(userId);
            notificationRecord.setType("TODO_REMINDER");
            notificationRecord.setTitle("待办提醒");
            notificationRecord.setContent("任务《" + todoItem.getTitle() + "》已到提醒时间");
            notificationRecord.setRelatedType("TODO");
            notificationRecord.setRelatedId(todoItem.getId());
            notificationRecord.setRemindAt(todoItem.getRemindAt());
            notificationRecord.setReadFlag(false);
            notificationMapper.insert(notificationRecord);
            notificationStreamService.publishChanged(userId);
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
