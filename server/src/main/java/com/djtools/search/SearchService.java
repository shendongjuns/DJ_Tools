package com.djtools.search;

import com.djtools.note.Note;
import com.djtools.note.NoteMapper;
import com.djtools.note.NoteTagMapper;
import com.djtools.security.CurrentUser;
import com.djtools.todo.TodoItem;
import com.djtools.todo.TodoMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SearchService {

    private final TodoMapper todoMapper;
    private final NoteMapper noteMapper;
    private final NoteTagMapper noteTagMapper;

    public SearchService(TodoMapper todoMapper, NoteMapper noteMapper, NoteTagMapper noteTagMapper) {
        this.todoMapper = todoMapper;
        this.noteMapper = noteMapper;
        this.noteTagMapper = noteTagMapper;
    }

    public List<SearchResultResponse> search(CurrentUser currentUser, String scope, String keyword) {
        List<SearchResultResponse> results = new ArrayList<>();
        if (keyword == null || keyword.isBlank()) {
            return results;
        }
        if ("all".equals(scope) || "todo".equals(scope)) {
            for (TodoItem todoItem : todoMapper.search(currentUser.getId(), keyword)) {
                HashMap<String, Object> meta = new HashMap<>();
                meta.put("status", todoItem.getStatus());
                meta.put("dueAt", todoItem.getDueAt());
                results.add(new SearchResultResponse(
                        "todo",
                        "TODO",
                        todoItem.getTitle(),
                        todoItem.getDescription(),
                        todoItem.getId(),
                        meta
                ));
            }
        }
        if ("all".equals(scope) || "note".equals(scope)) {
            for (Note note : noteMapper.search(currentUser.getId(), keyword)) {
                HashMap<String, Object> meta = new HashMap<>();
                meta.put("folderName", note.getFolderName());
                meta.put("tags", noteTagMapper.findByNoteId(note.getId()).stream().map(tag -> tag.getName()).toList());
                results.add(new SearchResultResponse(
                        "note",
                        "NOTE",
                        note.getTitle(),
                        note.getSummary() != null && !note.getSummary().isBlank()
                                ? note.getSummary()
                                : note.getContent().substring(0, Math.min(80, note.getContent().length())),
                        note.getId(),
                        meta
                ));
            }
        }
        return results;
    }
}

