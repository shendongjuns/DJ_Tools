package com.djtools.dashboard;

import com.djtools.note.NoteListItemResponse;
import com.djtools.todo.TodoResponse;
import java.util.List;

public record DashboardOverviewResponse(
        long todoUnfinishedCount,
        long noteCount,
        long unreadNotificationCount,
        List<TodoResponse> latestTodos,
        List<NoteListItemResponse> latestNotes
) {
}

