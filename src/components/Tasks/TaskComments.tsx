import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, type TaskComment } from '@/services/taskService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageCircle, Send, Trash2, Reply, PencilLine, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TaskCommentsProps = {
  taskId: string;
  initialComments?: TaskComment[];
  isOpen?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
};

const parseComments = (payload: unknown): TaskComment[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as TaskComment[];
  if (typeof payload === 'object') {
    const obj = payload as any;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.comments)) return obj.comments;
    if (Array.isArray(obj.results)) return obj.results;
  }
  return [];
};

const parseComment = (payload: unknown): TaskComment | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (typeof payload === 'object') {
    const obj = payload as any;
    if (obj.data && !Array.isArray(obj.data)) return obj.data as TaskComment;
    if (Array.isArray(obj.data)) return obj.data[0] || null;
    if (obj.comment) return obj.comment as TaskComment;
  }
  return payload as TaskComment;
};

const getCommentId = (comment: TaskComment) => {
  let id =
    (comment as any).id ??
    (comment as any)._id ??
    (comment as any).commentId ??
    (comment as any).uuid ??
    null;

  if (!id) {
    if (!(comment as any).__localId) {
      (comment as any).__localId = `local-${Math.random().toString(36).slice(2)}`;
    }
    id = (comment as any).__localId;
  }

  return String(id);
};

const sortByCreatedAt = (list: TaskComment[]) => {
  return [...list].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });
};

const getRelativeTimeLabel = (value?: string | Date | null) => {
  if (!value) return 'Just now';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const raw = formatDistanceToNow(date, { addSuffix: true });
  return raw.replace(/^about\s+/i, '');
};

const buildOptimisticComment = (
  text: string,
  currentUserId?: string,
  currentUserRole?: string,
  parentId?: string
): TaskComment => {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    parentId: parentId || null,
    attachments: [],
    createdAt: new Date().toISOString(),
    editedAt: null,
    isEdited: false,
    author: currentUserId
      ? {
        id: currentUserId,
        name: 'You',
        role: currentUserRole || null,
        avatar: null,
      }
      : null,
  } as TaskComment;
};

const TaskComments = ({
  taskId,
  initialComments,
  isOpen = true,
  currentUserId,
  currentUserRole,
}: TaskCommentsProps) => {
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<TaskComment | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const commentRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { data: commentsData, isLoading, isRefetching } = useQuery<TaskComment[]>({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const response = await taskService.getTaskComments(taskId);
      return parseComments(response);
    },
    initialData: initialComments && initialComments.length ? initialComments : undefined,
    enabled: Boolean(taskId) && isOpen,
  });

  const flatComments = useMemo(() => sortByCreatedAt(parseComments(commentsData)), [commentsData]);
  const commentLookup = useMemo(() => {
    const map = new Map<string, TaskComment>();
    flatComments.forEach(comment => {
      map.set(getCommentId(comment), comment);
    });
    return map;
  }, [flatComments]);
  useEffect(() => {
    if (!isOpen) return;
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return () => {
      commentRefs.current.clear();
    };
  }, [flatComments.length, isOpen]);

  const addCommentMutation = useMutation<
    TaskComment | undefined,
    unknown,
    { text: string; parentId?: string },
    { previous?: TaskComment[]; optimisticId?: string; pendingText?: string; replySnapshot?: TaskComment | null }
  >({
    mutationFn: async ({ text, parentId }: { text: string; parentId?: string }) => {
      const response = await taskService.addTaskComment(taskId, text, parentId);
      const parsed = parseComment(response);

      if (!parsed) {
        return buildOptimisticComment(text, currentUserId, currentUserRole || undefined, parentId);
      }

      if (!parsed.author && currentUserId) {
        parsed.author = {
          id: currentUserId,
          name: 'You',
          role: currentUserRole || null,
          avatar: null,
        };
      }

      return parsed;
    },
    onMutate: async ({ text, parentId }) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      await queryClient.cancelQueries({ queryKey: ['task-comments', taskId] });
      const previous = queryClient.getQueryData<TaskComment[]>(['task-comments', taskId]);
      const optimisticComment = buildOptimisticComment(trimmed, currentUserId, currentUserRole || undefined, parentId);
      const optimisticId = getCommentId(optimisticComment);
      queryClient.setQueryData<TaskComment[]>(['task-comments', taskId], (prev) => {
        const existing = parseComments(prev);
        return sortByCreatedAt([...existing, optimisticComment]);
      });
      setCommentText('');
      const replySnapshot = replyTarget;
      setReplyTarget(null);
      return { previous, optimisticId, pendingText: trimmed, replySnapshot };
    },
    onSuccess: (newComment, _variables, context) => {
      if (!newComment) {
        queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
        return;
      }
      queryClient.setQueryData<TaskComment[]>(['task-comments', taskId], (prev) => {
        const existing = parseComments(prev);
        const optimisticId = context?.optimisticId;
        let replaced = false;
        const next = existing.map((comment) => {
          if (optimisticId && getCommentId(comment) === optimisticId) {
            replaced = true;
            return newComment;
          }
          return comment;
        });
        if (!replaced) {
          next.push(newComment);
        }
        return sortByCreatedAt(next);
      });
      toast.success('Comment added');
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['task-comments', taskId], context.previous);
      }
      if (context?.pendingText) {
        setCommentText(context.pendingText);
      }
      if (context?.replySnapshot) {
        setReplyTarget(context.replySnapshot);
      }
      toast.error('Failed to add comment. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await taskService.deleteTaskComment(taskId, commentId);
      return commentId;
    },
    onSuccess: (commentId) => {
      queryClient.setQueryData<TaskComment[]>(['task-comments', taskId], (prev) => {
        const existing = parseComments(prev);
        const idsToRemove = new Set<string>([String(commentId)]);
        let changed = true;
        while (changed) {
          changed = false;
          existing.forEach(comment => {
            const thisId = getCommentId(comment);
            if (comment.parentId && idsToRemove.has(String(comment.parentId)) && !idsToRemove.has(thisId)) {
              idsToRemove.add(thisId);
              changed = true;
            }
          });
        }
        return existing.filter(comment => !idsToRemove.has(getCommentId(comment)));
      });
      toast.success('Comment removed');
      if (replyTarget && getCommentId(replyTarget) === String(commentId)) {
        setReplyTarget(null);
      }
      if (editingCommentId === String(commentId)) {
        setEditingCommentId(null);
        setCommentText('');
      }
    },
    onError: () => {
      toast.error('Failed to delete comment. Please try again.');
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string; text: string }) => {
      const response = await taskService.updateTaskComment(taskId, commentId, text);
      const parsed = parseComment(response);
      if (!parsed && currentUserId) {
        return {
          id: commentId,
          text,
          parentId: null,
          attachments: [],
          createdAt: new Date().toISOString(),
          editedAt: new Date().toISOString(),
          isEdited: true,
          author: {
            id: currentUserId,
            name: 'You',
            role: currentUserRole || null,
            avatar: null
          }
        } as TaskComment;
      }
      if (parsed && !parsed.author && currentUserId) {
        parsed.author = {
          id: currentUserId,
          name: 'You',
          role: currentUserRole || null,
          avatar: null
        };
      }
      return parsed;
    },
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<TaskComment[]>(['task-comments', taskId], (prev) => {
        const existing = parseComments(prev);
        if (!updatedComment) return existing;
        const updatedId = getCommentId(updatedComment);
        const next = existing.map(comment =>
          getCommentId(comment) === updatedId
            ? { ...comment, ...updatedComment }
            : comment
        );
        return sortByCreatedAt(next);
      });
      setEditingCommentId(null);
      setCommentText('');
      toast.success('Comment updated');
    },
    onError: () => {
      toast.error('Failed to edit comment. Please try again.');
    },
  });

  const isSubmitting = addCommentMutation.isPending || editCommentMutation.isPending;

  const handleSubmit = () => {
    const text = commentText.trim();
    if (!text) return;
    if (editingCommentId) {
      if (editCommentMutation.isPending) return;
      editCommentMutation.mutate({ commentId: editingCommentId, text });
    } else {
      if (addCommentMutation.isPending) return;
      addCommentMutation.mutate({
        text,
        parentId: replyTarget ? getCommentId(replyTarget) : undefined
      });
    }
  };

  const canDeleteComment = (comment: TaskComment) => {
    const authorId =
      (comment.author && (comment.author.id || (comment.author as any)._id)) || (comment as any).userId;
    return authorId && currentUserId && String(authorId) === String(currentUserId);
  };

  const startReply = (comment: TaskComment) => {
    setReplyTarget(comment);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const cancelReply = () => setReplyTarget(null);

  const startEdit = (comment: TaskComment) => {
    const authorId =
      (comment.author && (comment.author.id || (comment.author as any)._id)) || (comment as any).userId;
    if (!authorId || !currentUserId || String(authorId) !== String(currentUserId)) return;
    setEditingCommentId(getCommentId(comment));
    setReplyTarget(null);
    setCommentText(comment.text);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setCommentText('');
  };

  const scrollToComment = (parentId: string) => {
    const el = commentRefs.current.get(parentId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedCommentId(parentId);
      setTimeout(() => setHighlightedCommentId(prev => (prev === parentId ? null : prev)), 2000);
    }
  };

  const renderComments = (items: TaskComment[]) => {
    return items.map(comment => {
      const commentId = getCommentId(comment);
      const isOwn =
        currentUserId &&
        ((comment.author && (comment.author.id || (comment.author as any)._id)) || (comment as any).userId) &&
        String(
          (comment.author && (comment.author.id || (comment.author as any)._id)) || (comment as any).userId
        ) === String(currentUserId);
      const timestamp = getRelativeTimeLabel(comment.createdAt);
      const parentComment = comment.parentId ? commentLookup.get(String(comment.parentId)) : null;
      const parentTimestamp = parentComment ? getRelativeTimeLabel(parentComment.createdAt) : null;
      const authorName = comment.author?.name?.trim() || 'Unknown User';

      return (
        <div
          key={commentId}
          ref={(el) => {
            if (el) commentRefs.current.set(commentId, el);
          }}
          className={cn(
            'flex w-full gap-3 py-2',
            isOwn ? 'justify-end' : 'justify-start',
            highlightedCommentId === commentId ? 'animate-pulse' : ''
          )}
        >
          {!isOwn && (
            <Avatar className="h-10 w-10 shadow-md">
              <AvatarFallback className="p-0">
                {(authorName || '??')
                  .split(' ')
                  .map((name) => name[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className={cn('flex flex-col gap-2 max-w-[65%]', isOwn && 'items-end text-right')}>
            <div
              className={cn(
                'rounded-3xl px-4 py-3 shadow-sm border relative w-full',
                isOwn
                  ? 'bg-gradient-to-br from-emerald-500 via-emerald-500/95 to-emerald-600 text-white rounded-br-2xl'
                  : 'bg-white/95 dark:bg-slate-900/70 text-slate-900 dark:text-slate-100 rounded-bl-2xl border-slate-200/70 dark:border-slate-800/60',
                highlightedCommentId === commentId ? 'ring-2 ring-emerald-300 dark:ring-emerald-500' : ''
              )}
            >
              {!isOwn && (
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide">
                  <span className="font-semibold">
                    {authorName}
                  </span>
                </div>
              )}

              {parentComment && (
                <button
                  type="button"
                  onClick={() => scrollToComment(String(comment.parentId))}
                  className={cn(
                    'relative mt-3 text-left w-full overflow-hidden rounded-3xl border border-white/10',
                    isOwn ? 'bg-emerald-600/30' : 'bg-slate-200/80 dark:bg-slate-800/70'
                  )}
                >
                  <div
                    className={cn(
                      'absolute left-0 top-0 h-full w-1.5',
                      isOwn ? 'bg-emerald-200' : 'bg-emerald-500'
                    )}
                  />
                  <div className="pl-3 pr-4 py-2 text-xs">
                    <div className={cn('text-[12px] font-semibold', isOwn ? 'text-white' : 'text-emerald-700')}>
                      {parentComment.author?.name || 'Team member'}
                    </div>
                    <p
                      className={cn(
                        'line-clamp-2 opacity-80 mt-1',
                        isOwn ? 'text-white/90' : 'text-slate-700 dark:text-slate-200'
                      )}
                    >
                      {parentComment.text}
                    </p>
                  </div>
                </button>
              )}

              <p className="text-sm mt-2 whitespace-pre-wrap break-words leading-relaxed">
                {comment.text}{' '}
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wider rounded px-1 py-0.5 border ml-1',
                      isOwn
                        ? 'border-emerald-100 text-emerald-100'
                        : 'border-slate-300 text-slate-400 dark:text-slate-500'
                    )}
                  >
                    Edited
                  </span>
                )}
              </p>

              <div
                className={cn(
                  'flex items-center gap-3 text-[11px] mt-3 font-medium',
                  isOwn ? 'justify-end opacity-90' : 'justify-start'
                )}
              >
                <span
                  className={cn(
                    'text-[10px] tracking-wide',
                    isOwn ? 'text-white/80' : 'text-slate-500'
                  )}
                >
                  {timestamp}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-6 px-3 text-xs rounded-full shadow-none',
                      isOwn ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
                    )}
                    onClick={() => startReply(comment)}
                  >
                    <Reply className="h-3.5 w-3.5 mr-1" />
                    Reply
                  </Button>
                  {canDeleteComment(comment) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-7 w-7 rounded-full shadow-none',
                            isOwn ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
                          )}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="w-28 text-xs">
                        <DropdownMenuItem
                          onClick={() => startEdit(comment)}
                          className="flex items-center gap-2"
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteCommentMutation.mutate(commentId)}
                          className="flex items-center gap-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-[32px] border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 shadow-2xl">
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.25),_transparent_55%)]" />
      <div className="relative z-10 p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-red-100 text-red-500 dark:bg-red-500/10 dark:text-red-300 flex items-center justify-center shadow-inner">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-base leading-tight">Team Discussion</p>
              <p className="text-xs text-muted-foreground">Keep everyone aligned in real-time</p>
            </div>
          </div>
          {(isLoading || isRefetching) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-inner">
          <ScrollArea className="h-[26rem] px-4">
            <div className="space-y-4 py-4">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const isOwnSkeleton = idx % 2 === 1;
                    return (
                      <div
                        key={`comment-skeleton-${idx}`}
                        className={cn('flex w-full gap-3 py-2', isOwnSkeleton ? 'justify-end' : 'justify-start')}
                      >
                        {!isOwnSkeleton && <Skeleton className="h-10 w-10 rounded-full" />}
                        <div className={cn('flex flex-col gap-2 max-w-[65%]', isOwnSkeleton && 'items-end text-right')}>
                          <div
                            className={cn(
                              'rounded-3xl px-4 py-3 border relative w-[min(320px,80vw)] space-y-3',
                              isOwnSkeleton
                                ? 'bg-emerald-500/20 border-emerald-200/60'
                                : 'bg-white/80 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/60'
                            )}
                          >
                            <Skeleton className="h-3 w-24 rounded-full" />
                            <Skeleton className="h-3 w-full rounded-full" />
                            <Skeleton className="h-3 w-2/3 rounded-full" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {flatComments.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-6">
                      No comments yet. Start the discussion below!
                    </div>
                  )}

                  {renderComments(flatComments)}
                </>
              )}
              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-3 rounded-[28px] border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/60 px-4 py-3 shadow-lg">
          {(replyTarget || editingCommentId) && (
            <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 space-y-1">
              {replyTarget && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      Replying to <span className="font-semibold">{replyTarget.author?.name || 'Team member'}</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-auto px-2 py-0" onClick={cancelReply}>
                      Cancel
                    </Button>
                  </div>
                  <p className="line-clamp-2 text-left text-slate-600 dark:text-slate-300">{replyTarget.text}</p>
                </>
              )}
              {editingCommentId && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="truncate font-semibold text-slate-700 dark:text-slate-200">Editing message</div>
                    <Button type="button" variant="ghost" size="sm" className="h-auto px-2 py-0" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                  <p className="line-clamp-2 text-left italic opacity-80">
                    {commentLookup.get(editingCommentId)?.text || ''}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="flex items-end gap-3">
            <Textarea
              placeholder="Message..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              ref={textareaRef}
              rows={2}
              className="flex-1 shadow-inner rounded-2xl border-none bg-slate-50 dark:bg-slate-900/80 focus-visible:ring-red-400"
            />
            <Button
              type="button"
              size="lg"
              className="gap-2 px-5 py-6 rounded-2xl bg-red-500 hover:bg-red-500/90 text-white shadow-lg"
              disabled={!commentText.trim() || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="text-xs font-semibold uppercase tracking-wide">Send</span>
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Messages are visible to everyone on this task.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskComments;
