"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  Check,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

import {
  leadNotesService,
} from "./lead-notes-service";
import {
  LEAD_NOTE_TYPES,
  type CreateLeadNoteInput,
  type LeadNote,
  type LeadNoteType,
  type UpdateLeadNoteInput,
} from "./lead-note-types";

interface ApiErrorResponse {
  message?: string;

  error?: {
    message?: string;
  };
}

type TypeFilter =
  | LeadNoteType
  | "ALL";

const TYPE_CLASSES: Record<
  LeadNoteType,
  string
> = {
  GENERAL:
    "bg-slate-100 text-slate-700",

  CALL:
    "bg-blue-50 text-blue-700",

  EMAIL:
    "bg-violet-50 text-violet-700",

  SMS:
    "bg-cyan-50 text-cyan-700",

  MEETING:
    "bg-amber-50 text-amber-700",

  VIEWING:
    "bg-emerald-50 text-emerald-700",

  FOLLOW_UP:
    "bg-orange-50 text-orange-700",

  STATUS_UPDATE:
    "bg-rose-50 text-rose-700",
};

function formatLabel(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function getAuthorName(
  note: LeadNote,
): string {
  if (!note.createdByUser) {
    return "System user";
  }

  return [
    note.createdByUser
      .firstName,

    note.createdByUser
      .lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    axios.isAxiosError<
      ApiErrorResponse
    >(error)
  ) {
    if (!error.response) {
      return "Cannot connect to the backend API.";
    }

    return (
      error.response.data
        ?.message ??
      error.response.data
        ?.error?.message ??
      `Request failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The Lead Notes request failed.";
}

export function LeadNotesPanel({
  leadId,
}: {
  leadId: string;
}) {
  const queryClient =
    useQueryClient();

  const [page, setPage] =
    useState(1);

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>(
      "ALL",
    );

  const [
    newType,
    setNewType,
  ] =
    useState<LeadNoteType>(
      "GENERAL",
    );

  const [
    newContent,
    setNewContent,
  ] = useState("");

  const [
    editingNoteId,
    setEditingNoteId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    editType,
    setEditType,
  ] =
    useState<LeadNoteType>(
      "GENERAL",
    );

  const [
    editContent,
    setEditContent,
  ] = useState("");

  const notesQuery = useQuery({
    queryKey: [
      "lead-notes",
      leadId,
      {
        page,
        typeFilter,
      },
    ],

    queryFn: () =>
      leadNotesService.list({
        leadId,

        ...(typeFilter !==
        "ALL"
          ? {
              type:
                typeFilter,
            }
          : {}),

        page,
        limit: 5,
      }),

    enabled: Boolean(leadId),
  });

  async function refreshNotes() {
    await queryClient
      .invalidateQueries({
        queryKey: [
          "lead-notes",
          leadId,
        ],
      });
  }

  const createMutation =
    useMutation({
      mutationFn: (
        input:
          CreateLeadNoteInput,
      ) =>
        leadNotesService.create(
          leadId,
          input,
        ),

      onSuccess: async () => {
        setNewType("GENERAL");
        setNewContent("");
        setPage(1);

        await refreshNotes();
      },
    });

  const updateMutation =
    useMutation({
      mutationFn: ({
        noteId,
        input,
      }: {
        noteId: string;
        input:
          UpdateLeadNoteInput;
      }) =>
        leadNotesService.update(
          noteId,
          input,
        ),

      onSuccess: async () => {
        setEditingNoteId(null);
        setEditContent("");

        await refreshNotes();
      },
    });

  const deleteMutation =
    useMutation({
      mutationFn: (
        noteId: string,
      ) =>
        leadNotesService.delete(
          noteId,
        ),

      onSuccess: async () => {
        await refreshNotes();
      },
    });

  const items =
    notesQuery.data?.items ??
    [];

  const meta =
    notesQuery.data?.meta;

  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    deleteMutation.error;

  function submitNewNote(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const content =
      newContent.trim();

    if (!content) {
      return;
    }

    createMutation.mutate({
      type: newType,
      content,
    });
  }

  function beginEdit(
    note: LeadNote,
  ) {
    setEditingNoteId(
      note.id,
    );

    setEditType(note.type);
    setEditContent(
      note.content,
    );
  }

  function cancelEdit() {
    setEditingNoteId(null);
    setEditContent("");
  }

  function saveEdit(
    noteId: string,
  ) {
    const content =
      editContent.trim();

    if (!content) {
      return;
    }

    updateMutation.mutate({
      noteId,

      input: {
        type: editType,
        content,
      },
    });
  }

  function deleteNote(
    note: LeadNote,
  ) {
    const confirmed =
      window.confirm(
        "Delete this Lead Note? This action cannot be undone.",
      );

    if (confirmed) {
      deleteMutation.mutate(
        note.id,
      );
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText
              size={20}
              className="text-emerald-700"
            />

            <h2 className="text-lg font-semibold text-slate-950">
              Lead Notes
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Record calls, meetings,
            messages, viewings, and
            follow-up activity.
          </p>
        </div>

        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Filter type
          </span>

          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(
                event.target
                  .value as
                  TypeFilter,
              );

              setPage(1);
            }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="ALL">
              All types
            </option>

            {LEAD_NOTE_TYPES.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {formatLabel(
                    type,
                  )}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <form
        onSubmit={submitNewNote}
        className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
      >
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Type
            </span>

            <select
              value={newType}
              onChange={(event) =>
                setNewType(
                  event.target
                    .value as
                    LeadNoteType,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              {LEAD_NOTE_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {formatLabel(
                      type,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-700">
              Note
            </span>

            <textarea
              value={newContent}
              onChange={(event) =>
                setNewContent(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="Add a call result, client preference, meeting note, or follow-up update."
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={
            !newContent.trim() ||
            createMutation
              .isPending
          }
          className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <LoaderCircle
              size={16}
              className="animate-spin"
            />
          ) : (
            <Plus size={16} />
          )}

          Add Note
        </button>
      </form>

      {mutationError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {getErrorMessage(
            mutationError,
          )}
        </div>
      )}

      <div className="mt-6">
        {notesQuery.isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <LoaderCircle className="animate-spin text-emerald-700" />
          </div>
        ) : notesQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {getErrorMessage(
              notesQuery.error,
            )}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <FileText className="mx-auto text-slate-400" />

            <p className="mt-3 font-medium text-slate-800">
              No Lead Notes yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add the first update
              using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((note) => {
              const isEditing =
                editingNoteId ===
                note.id;

              const isDeleting =
                deleteMutation
                  .isPending &&
                deleteMutation
                  .variables ===
                  note.id;

              return (
                <article
                  key={note.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <select
                        value={editType}
                        onChange={(event) =>
                          setEditType(
                            event.target
                              .value as
                              LeadNoteType,
                          )
                        }
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm sm:w-52"
                      >
                        {LEAD_NOTE_TYPES.map(
                          (type) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {formatLabel(
                                type,
                              )}
                            </option>
                          ),
                        )}
                      </select>

                      <textarea
                        value={editContent}
                        onChange={(event) =>
                          setEditContent(
                            event.target
                              .value,
                          )
                        }
                        rows={4}
                        className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={
                            !editContent.trim() ||
                            updateMutation
                              .isPending
                          }
                          onClick={() =>
                            saveEdit(
                              note.id,
                            )
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          <Check size={15} />
                          Save
                        </button>

                        <button
                          type="button"
                          disabled={
                            updateMutation
                              .isPending
                          }
                          onClick={cancelEdit}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700"
                        >
                          <X size={15} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${TYPE_CLASSES[note.type]}`}
                          >
                            {formatLabel(
                              note.type,
                            )}
                          </span>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {note.content}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              beginEdit(
                                note,
                              )
                            }
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                            aria-label="Edit note"
                          >
                            <Pencil
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            disabled={
                              isDeleting
                            }
                            onClick={() =>
                              deleteNote(
                                note,
                              )
                            }
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            aria-label="Delete note"
                          >
                            {isDeleting ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={15}
                              />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                        Added by{" "}
                        <span className="font-medium text-slate-700">
                          {getAuthorName(
                            note,
                          )}
                        </span>
                        {" · "}
                        {formatDateTime(
                          note.createdAt,
                        )}

                        {note.updatedAt !==
                          note.createdAt && (
                          <>
                            {" · "}
                            Edited{" "}
                            {formatDateTime(
                              note.updatedAt,
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {meta &&
        meta.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
            <button
              type="button"
              disabled={
                page <= 1 ||
                notesQuery.isFetching
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 font-medium disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-slate-500">
              Page {meta.page} of{" "}
              {meta.totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >=
                  meta.totalPages ||
                notesQuery.isFetching
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current + 1,
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
    </section>
  );
}
