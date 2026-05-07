CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS user_account (
    id BIGSERIAL PRIMARY KEY,
    nickname VARCHAR(64) NOT NULL,
    login_account VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    password_changed BOOLEAN NOT NULL DEFAULT FALSE,
    force_password_change BOOLEAN NOT NULL DEFAULT TRUE,
    theme_id VARCHAR(32) NOT NULL DEFAULT 'cartoon',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_account IS '系统用户账号表。';
COMMENT ON COLUMN user_account.id IS '用户主键 ID。';
COMMENT ON COLUMN user_account.nickname IS '用户显示昵称。';
COMMENT ON COLUMN user_account.login_account IS '登录账号，系统内唯一。';
COMMENT ON COLUMN user_account.password_hash IS 'BCrypt 加密后的密码摘要。';
COMMENT ON COLUMN user_account.password_changed IS '是否已经完成首次密码修改。';
COMMENT ON COLUMN user_account.force_password_change IS '是否仍需强制修改初始密码。';
COMMENT ON COLUMN user_account.theme_id IS '当前选中的前端主题标识。';
COMMENT ON COLUMN user_account.created_at IS '账号创建时间。';
COMMENT ON COLUMN user_account.updated_at IS '账号最后更新时间。';

CREATE TABLE IF NOT EXISTS refresh_token (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    token VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE refresh_token IS '刷新令牌表，用于维护登录续期状态。';
COMMENT ON COLUMN refresh_token.id IS '刷新令牌主键 ID。';
COMMENT ON COLUMN refresh_token.user_id IS '所属用户 ID。';
COMMENT ON COLUMN refresh_token.token IS '刷新令牌字符串，系统内唯一。';
COMMENT ON COLUMN refresh_token.expires_at IS '刷新令牌过期时间。';
COMMENT ON COLUMN refresh_token.revoked IS '是否已失效或被主动吊销。';
COMMENT ON COLUMN refresh_token.created_at IS '刷新令牌创建时间。';

CREATE TABLE IF NOT EXISTS todo_item (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ,
    remind_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE todo_item IS '待办事项表，保存 TODO 任务主体数据。';
COMMENT ON COLUMN todo_item.id IS '待办主键 ID。';
COMMENT ON COLUMN todo_item.user_id IS '所属用户 ID。';
COMMENT ON COLUMN todo_item.title IS '待办标题。';
COMMENT ON COLUMN todo_item.description IS '待办详细描述。';
COMMENT ON COLUMN todo_item.due_at IS '截止时间。';
COMMENT ON COLUMN todo_item.remind_at IS '提醒触发时间。';
COMMENT ON COLUMN todo_item.status IS '待办持久化状态，取值为 PENDING、IN_PROGRESS、COMPLETED、CANCELLED、UNFINISHED。';
COMMENT ON COLUMN todo_item.completed_at IS '完成时间，未完成时为空。';
COMMENT ON COLUMN todo_item.cancelled_at IS '取消时间，未取消时为空。';
COMMENT ON COLUMN todo_item.deleted IS '是否逻辑删除。';
COMMENT ON COLUMN todo_item.created_at IS '待办创建时间。';
COMMENT ON COLUMN todo_item.updated_at IS '待办最后更新时间。';

CREATE TABLE IF NOT EXISTS notification (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(128) NOT NULL,
    content TEXT,
    related_type VARCHAR(32),
    related_id BIGINT,
    remind_at TIMESTAMPTZ,
    read_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notification IS '站内提醒表，用于顶部铃铛展示提醒消息。';
COMMENT ON COLUMN notification.id IS '提醒主键 ID。';
COMMENT ON COLUMN notification.user_id IS '所属用户 ID。';
COMMENT ON COLUMN notification.type IS '提醒类型，例如 TODO_REMINDER。';
COMMENT ON COLUMN notification.title IS '提醒标题。';
COMMENT ON COLUMN notification.content IS '提醒正文内容。';
COMMENT ON COLUMN notification.related_type IS '关联业务对象类型。';
COMMENT ON COLUMN notification.related_id IS '关联业务对象 ID。';
COMMENT ON COLUMN notification.remind_at IS '提醒对应的计划触发时间。';
COMMENT ON COLUMN notification.read_flag IS '是否已读。';
COMMENT ON COLUMN notification.created_at IS '提醒生成时间。';

CREATE TABLE IF NOT EXISTS note_folder (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name)
);

COMMENT ON TABLE note_folder IS '笔记文件夹表。';
COMMENT ON COLUMN note_folder.id IS '文件夹主键 ID。';
COMMENT ON COLUMN note_folder.user_id IS '所属用户 ID。';
COMMENT ON COLUMN note_folder.name IS '文件夹名称，同一用户下唯一。';
COMMENT ON COLUMN note_folder.sort_order IS '文件夹排序值，越小越靠前。';
COMMENT ON COLUMN note_folder.created_at IS '文件夹创建时间。';
COMMENT ON COLUMN note_folder.updated_at IS '文件夹最后更新时间。';

CREATE TABLE IF NOT EXISTS note (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    folder_id BIGINT REFERENCES note_folder(id) ON DELETE SET NULL,
    title VARCHAR(160) NOT NULL,
    summary VARCHAR(255),
    content TEXT NOT NULL,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE note IS '笔记主表，保存标题、摘要、正文与分享状态。';
COMMENT ON COLUMN note.id IS '笔记主键 ID。';
COMMENT ON COLUMN note.user_id IS '所属用户 ID。';
COMMENT ON COLUMN note.folder_id IS '所属文件夹 ID，可为空。';
COMMENT ON COLUMN note.title IS '笔记标题。';
COMMENT ON COLUMN note.summary IS '笔记摘要，用于列表展示。';
COMMENT ON COLUMN note.content IS 'Markdown 正文内容。';
COMMENT ON COLUMN note.is_shared IS '是否存在可用的分享状态标记。';
COMMENT ON COLUMN note.created_at IS '笔记创建时间。';
COMMENT ON COLUMN note.updated_at IS '笔记最后更新时间。';

CREATE TABLE IF NOT EXISTS note_tag (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name)
);

COMMENT ON TABLE note_tag IS '笔记标签表，用于标签筛选与搜索。';
COMMENT ON COLUMN note_tag.id IS '标签主键 ID。';
COMMENT ON COLUMN note_tag.user_id IS '所属用户 ID。';
COMMENT ON COLUMN note_tag.name IS '标签名称，同一用户下唯一。';
COMMENT ON COLUMN note_tag.created_at IS '标签创建时间。';

CREATE TABLE IF NOT EXISTS note_tag_rel (
    note_id BIGINT NOT NULL REFERENCES note(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES note_tag(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

COMMENT ON TABLE note_tag_rel IS '笔记与标签的关联关系表。';
COMMENT ON COLUMN note_tag_rel.note_id IS '关联的笔记 ID。';
COMMENT ON COLUMN note_tag_rel.tag_id IS '关联的标签 ID。';

CREATE TABLE IF NOT EXISTS note_attachment (
    id BIGSERIAL PRIMARY KEY,
    note_id BIGINT NOT NULL REFERENCES note(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    object_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(128),
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE note_attachment IS '笔记附件元数据表，文件实体存储在 MinIO。';
COMMENT ON COLUMN note_attachment.id IS '附件主键 ID。';
COMMENT ON COLUMN note_attachment.note_id IS '所属笔记 ID。';
COMMENT ON COLUMN note_attachment.user_id IS '所属用户 ID。';
COMMENT ON COLUMN note_attachment.object_name IS 'MinIO 中的对象名称。';
COMMENT ON COLUMN note_attachment.original_filename IS '用户上传时的原始文件名。';
COMMENT ON COLUMN note_attachment.content_type IS '附件 MIME 类型。';
COMMENT ON COLUMN note_attachment.size_bytes IS '附件大小，单位字节。';
COMMENT ON COLUMN note_attachment.created_at IS '附件创建时间。';

CREATE TABLE IF NOT EXISTS note_share (
    id BIGSERIAL PRIMARY KEY,
    note_id BIGINT NOT NULL REFERENCES note(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    share_token VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    disabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE note_share IS '笔记分享表，用于匿名只读访问。';
COMMENT ON COLUMN note_share.id IS '分享记录主键 ID。';
COMMENT ON COLUMN note_share.note_id IS '所属笔记 ID。';
COMMENT ON COLUMN note_share.user_id IS '所属用户 ID。';
COMMENT ON COLUMN note_share.share_token IS '分享访问令牌，系统内唯一。';
COMMENT ON COLUMN note_share.expires_at IS '分享过期时间，为空表示长期有效。';
COMMENT ON COLUMN note_share.disabled IS '分享是否已被手动关闭。';
COMMENT ON COLUMN note_share.created_at IS '分享记录创建时间。';

CREATE INDEX IF NOT EXISTS idx_todo_user_status ON todo_item(user_id, status);
CREATE INDEX IF NOT EXISTS idx_todo_due_at ON todo_item(due_at);
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON notification(user_id, read_flag);
CREATE INDEX IF NOT EXISTS idx_note_user_folder ON note(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_note_share_token ON note_share(share_token);

CREATE INDEX IF NOT EXISTS idx_todo_title_trgm ON todo_item USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_todo_desc_trgm ON todo_item USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_note_title_trgm ON note USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_note_content_trgm ON note USING GIN (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_note_tag_name_trgm ON note_tag USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_note_folder_name_trgm ON note_folder USING GIN (name gin_trgm_ops);

INSERT INTO user_account (
    nickname,
    login_account,
    password_hash,
    password_changed,
    force_password_change,
    theme_id
)
SELECT
    'admin',
    'admin',
    '$2b$10$nHsoDdl.Bm1FyJe2NnC3G.8kmkbUToefSDzpE53r0Z7CoTbNrE.hq',
    FALSE,
    TRUE,
    'cartoon'
WHERE NOT EXISTS (
    SELECT 1
    FROM user_account
    WHERE login_account = 'admin'
);
