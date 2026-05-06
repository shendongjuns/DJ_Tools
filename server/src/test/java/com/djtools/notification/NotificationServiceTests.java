package com.djtools.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.djtools.todo.TodoItem;
import com.djtools.todo.TodoMapper;
import com.djtools.user.UserAccountMapper;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class NotificationServiceTests {

    private static final OffsetDateTime REMIND_AT = OffsetDateTime.of(2026, 4, 30, 16, 20, 0, 0, ZoneOffset.ofHours(8));

    private NotificationMapper notificationMapper;
    private TodoMapper todoMapper;
    private UserAccountMapper userAccountMapper;
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationMapper = org.mockito.Mockito.mock(NotificationMapper.class);
        todoMapper = org.mockito.Mockito.mock(TodoMapper.class);
        userAccountMapper = org.mockito.Mockito.mock(UserAccountMapper.class);
        notificationService = new NotificationService(notificationMapper, todoMapper, userAccountMapper);
    }

    @Test
    void generateTodoRemindersShouldSkipWhenSameReminderTimeAlreadyExists() {
        TodoItem todoItem = reminderTodo();
        when(userAccountMapper.findFirstUserId()).thenReturn(1L);
        when(todoMapper.findNeedReminder(1L)).thenReturn(List.of(todoItem));
        when(notificationMapper.countExists(1L, "TODO_REMINDER", "TODO", 99L, REMIND_AT)).thenReturn(1L);

        notificationService.generateTodoReminders();

        verify(notificationMapper, never()).insert(any(NotificationRecord.class));
    }

    @Test
    void generateTodoRemindersShouldInsertWhenReminderTimeChanges() {
        TodoItem todoItem = reminderTodo();
        when(userAccountMapper.findFirstUserId()).thenReturn(1L);
        when(todoMapper.findNeedReminder(1L)).thenReturn(List.of(todoItem));
        when(notificationMapper.countExists(1L, "TODO_REMINDER", "TODO", 99L, REMIND_AT)).thenReturn(0L);

        notificationService.generateTodoReminders();

        verify(notificationMapper).countExists(1L, "TODO_REMINDER", "TODO", 99L, REMIND_AT);
        ArgumentCaptor<NotificationRecord> captor = ArgumentCaptor.forClass(NotificationRecord.class);
        verify(notificationMapper).insert(captor.capture());
        assertEquals(REMIND_AT, captor.getValue().getRemindAt());
        assertEquals(99L, captor.getValue().getRelatedId());
    }

    @Test
    void generateTodoRemindersShouldDoNothingWhenNoUserExists() {
        when(userAccountMapper.findFirstUserId()).thenReturn(null);

        notificationService.generateTodoReminders();

        verify(todoMapper, never()).findNeedReminder(any());
        verify(notificationMapper, never()).insert(any(NotificationRecord.class));
    }

    private TodoItem reminderTodo() {
        TodoItem todoItem = new TodoItem();
        todoItem.setId(99L);
        todoItem.setTitle("待提醒任务");
        todoItem.setRemindAt(REMIND_AT);
        return todoItem;
    }
}
