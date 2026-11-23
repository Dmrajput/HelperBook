import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { PermissionGate } from "@/components/PermissionGate";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
export default function SupportPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");

  const listQuery = useQuery({
    queryKey: ["tickets"],
    queryFn: () => adminApi.tickets("page=1&limit=50"),
  });

  const ticketQuery = useQuery({
    queryKey: ["ticket", selectedId],
    queryFn: () => adminApi.ticket(selectedId),
    enabled: Boolean(selectedId),
  });

  const replyMutation = useMutation({
    mutationFn: (body) => adminApi.reply(selectedId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", selectedId] });
      setReply("");
    },
  });

  const noteMutation = useMutation({
    mutationFn: (body) => adminApi.note(selectedId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", selectedId] });
      setNote("");
    },
  });

  const tickets = listQuery.data?.tickets || [];
  const selected = ticketQuery.data;

  if (listQuery.error) return <ErrorState message={listQuery.error.message} onRetry={listQuery.refetch} />;

  return (
    <div>
      <PageHeader
        title="Support"
        description="Customer tickets and internal notes."
        actions={
          <Link to="/settings" className="text-sm font-medium text-brand hover:underline">
            Back to settings
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Inbox</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[70vh] space-y-1 overflow-y-auto p-2">
            {listQuery.isLoading ? <p className="text-sm text-muted">Loading…</p> : null}
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${selectedId === ticket.id ? "bg-indigo-50 text-brand" : "hover:bg-slate-50"}`}
                onClick={() => setSelectedId(ticket.id)}
              >
                <p className="font-medium">{ticket.ticketNumber}</p>
                <p className="truncate text-muted">{ticket.subject}</p>
              </button>
            ))}
            {!tickets.length && !listQuery.isLoading ? <p className="px-2 text-sm text-muted">No tickets</p> : null}
          </CardContent>
        </Card>

        <Card>
          {selected?.ticket ? (
            <>
              <CardHeader>
                <CardTitle>{selected.ticket.ticketNumber}</CardTitle>
                <p className="text-sm text-muted">{selected.ticket.subject}</p>
                <StatusBadge status={selected.ticket.status} />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                  {(selected.ticket.messages || []).map((message) => (
                    <p key={message._id} className="text-sm">
                      <span className="font-medium">{message.authorType}:</span> {message.body}
                    </p>
                  ))}
                </div>
                <PermissionGate permission="support.reply">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      replyMutation.mutate({ body: reply });
                    }}
                  >
                    <Textarea
                      aria-label="Customer reply"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Reply to customer"
                    />
                    <Button className="mt-2" type="submit" disabled={replyMutation.isPending}>
                      Send reply
                    </Button>
                  </form>
                  <form
                    className="mt-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      noteMutation.mutate({ body: note });
                    }}
                  >
                    <Textarea
                      aria-label="Internal note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Internal note"
                    />
                    <Button className="mt-2" variant="secondary" type="submit" disabled={noteMutation.isPending}>
                      Add internal note
                    </Button>
                  </form>
                </PermissionGate>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center text-sm text-muted">Select a ticket</CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}