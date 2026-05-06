package com.djtools.todo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.djtools.security.CurrentUser;
import com.djtools.user.UserAccount;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class TodoServiceTests {

    private static final ZoneOffset ZONE_OFFSET = ZoneOffset.ofHours(8);
    private static final OffsetDateTime FIXED_NOW = OffsetDateTime.of(2026, 4, 30, 16, 0, 0, 0, ZONE_OFFSET);

    private TodoMapper todoMapper;
    private TodoService todoService;
    private CurrentUser currentUser;

    @BeforeEach
    void setUp() {
        todoMapper = org.mockito.Mockito.mock(TodoMapper.class);
        Clock fixedClock = Clock.fixed(Instant.from(FIXED_NOW), ZONE_OFFSET);
        todoService = new TodoService(todoMapper, fixedClock);

        UserAccount userAccount = new UserAccount();
        userAccount.setId(1L);
        userAccount.setNickname("tester");
        userAccount.setLoginAccount("tester");
        currentUser = new CurrentUser(userAccount);
    }

    @Test
    void createShouldScheduleReminderTenMinutesBeforeDueTime() {
        AtomicReference<TodoItem> stored = prepareCreateFlow();
        OffsetDateTime dueAt = FIXED_NOW.plusMinutes(30);
        OffsetDateTime manualRemindAt = FIXED_NOW.plusMinutes(25);

        TodoResponse response = todoService.create(
                currentUser,
                new TodoRequest("任务", "描述", dueAt, manualRemindAt, null, null, TodoStatus.PENDING)
        );

        assertEquals(dueAt.minusMinutes(10), stored.get().getRemindAt());
        assertEquals(dueAt.minusMinutes(10), response.remindAt());
    }

    @Test
    void createShouldScheduleReminderOneMinuteBeforeImminentDueTime() {
        AtomicReference<TodoItem> stored = prepareCreateFlow();
        OffsetDateTime dueAt = FIXED_NOW.plusMinutes(5);

        TodoResponse response = todoService.create(
                currentUser,
                new TodoRequest("任务", "描述", dueAt, null, null, null, TodoStatus.PENDING)
        );

        assertEquals(dueAt.minusMinutes(1), stored.get().getRemindAt());
        assertEquals(dueAt.minusMinutes(1), response.remindAt());
    }

    @Test
    void createShouldScheduleImmediateReminderWhenDueTimeIsWithinOneMinute() {
        AtomicReference<TodoItem> stored = prepareCreateFlow();
        OffsetDateTime dueAt = FIXED_NOW.plusSeconds(30);

        TodoResponse response = todoService.create(
                currentUser,
                new TodoRequest("任务", "描述", dueAt, null, null, null, TodoStatus.PENDING)
        );

        assertEquals(FIXED_NOW, stored.get().getRemindAt());
        assertEquals(FIXED_NOW, response.remindAt());
    }

    @Test
    void createShouldClearReminderWhenDueTimeIsMissing() {
        AtomicReference<TodoItem> stored = prepareCreateFlow();

        TodoResponse response = todoService.create(
                currentUser,
                new TodoRequest("任务", "描述", null, FIXED_NOW.plusMinutes(1), null, null, TodoStatus.PENDING)
        );

        assertNull(stored.get().getRemindAt());
        assertNull(response.remindAt());
    }

    @Test
    void updateShouldClearReminderWhenTodoIsCompleted() {
        TodoItem existing = new TodoItem();
        existing.setId(1L);
        existing.setUserId(1L);
        existing.setTitle("任务");
        existing.setDueAt(FIXED_NOW.plusMinutes(20));
        existing.setStatus(TodoStatus.PENDING);
        when(todoMapper.findById(1L, 1L)).thenReturn(existing);

        todoService.update(
                currentUser,
                1L,
                new TodoRequest("任务", "描述", existing.getDueAt(), FIXED_NOW.plusMinutes(9), null, null, TodoStatus.COMPLETED)
        );

        ArgumentCaptor<TodoItem> captor = ArgumentCaptor.forClass(TodoItem.class);
        verify(todoMapper).update(captor.capture());
        assertNull(captor.getValue().getRemindAt());
        assertEquals(FIXED_NOW, captor.getValue().getCompletedAt());
    }

    @Test
    void updateShouldKeepExistingReminderWhenDueTimeIsUnchanged() {
        OffsetDateTime dueAt = FIXED_NOW.plusSeconds(30);
        TodoItem existing = new TodoItem();
        existing.setId(1L);
        existing.setUserId(1L);
        existing.setTitle("任务");
        existing.setDueAt(dueAt);
        existing.setRemindAt(FIXED_NOW);
        existing.setStatus(TodoStatus.PENDING);
        when(todoMapper.findById(1L, 1L)).thenReturn(existing);

        todoService.update(
                currentUser,
                1L,
                new TodoRequest("新标题", "新描述", dueAt, null, null, null, TodoStatus.IN_PROGRESS)
        );

        ArgumentCaptor<TodoItem> captor = ArgumentCaptor.forClass(TodoItem.class);
        verify(todoMapper).update(captor.capture());
        assertEquals(FIXED_NOW, captor.getValue().getRemindAt());
    }

    @Test
    void updateStatusShouldRecalculateReminderWhenTodoReturnsToPending() {
        TodoItem existing = new TodoItem();
        existing.setId(1L);
        existing.setUserId(1L);
        existing.setTitle("任务");
        existing.setDueAt(FIXED_NOW.plusMinutes(45));
        existing.setStatus(TodoStatus.COMPLETED);
        existing.setCompletedAt(FIXED_NOW.minusMinutes(1));
        when(todoMapper.findById(1L, 1L)).thenReturn(existing);

        TodoResponse response = todoService.updateStatus(
                currentUser,
                1L,
                new TodoStatusUpdateRequest(TodoStatus.PENDING, null, null)
        );

        ArgumentCaptor<TodoItem> captor = ArgumentCaptor.forClass(TodoItem.class);
        verify(todoMapper).updateStatus(captor.capture());
        assertEquals(FIXED_NOW.plusMinutes(35), captor.getValue().getRemindAt());
        assertEquals(FIXED_NOW.plusMinutes(35), response.remindAt());
        assertNull(response.completedAt());
    }

    private AtomicReference<TodoItem> prepareCreateFlow() {
        AtomicReference<TodoItem> stored = new AtomicReference<>();
        when(todoMapper.insert(any(TodoItem.class))).thenAnswer(invocation -> {
            TodoItem todoItem = invocation.getArgument(0);
            todoItem.setId(1L);
            stored.set(todoItem);
            return 1;
        });
        when(todoMapper.findById(eq(1L), eq(1L))).thenAnswer(invocation -> stored.get());
        return stored;
    }
}
