import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PermissionGate } from "@/components/PermissionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQueryParams } from "@/hooks/useQueryParams";
import { formatDateTime, titleCase, toSearchParams } from "@/lib/utils";

const DEMO_STATUSES = ["new", "contacted", "demo_scheduled", "demo_completed", "closed", "spam"];
const INQUIRY_STATUSES = ["new", "contacted", "closed", "spam"];

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useQueryParams({
    page: "1",
    limit: "20",
    type: "",
    status: "",
    search: "",
    startDate: "",
    endDate: "",
  });
  const [searchInput, setSearchInput] = useState(params.search || "");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState("");
  const [statusDraft, setStatusDraft] = useState("");

  const queryString = useMemo(
    () =>
      toSearchParams({
        page: params.page,
        limit: params.limit,
        type: params.type,
        status: params.status,
        search: debouncedSearch,
        startDate: params.startDate,
        endDate: params.endDate,
      }),
    [params, debouncedSearch]
  );

  const listQuery = useQuery({
    queryKey: ["leads", queryString],
    queryFn: () => adminApi.leads(queryString),
  });

  const detailQuery = useQuery({
    queryKey: ["lead", selectedId],
    queryFn: () => adminApi.lead(selectedId),
    enabled: Boolean(selectedId),
  });

  const updateMutation = useMutation({
    mutationFn: (body) => adminApi.updateLead(selectedId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", selectedId] });
      setNote("");
    },
  });

  const lead = detailQuery.data?.lead;
  const statusOptions = lead?.type === "inquiry" ? INQUIRY_STATUSES : DEMO_STATUSES;

  return (
    <div>
      <PageHeader
        title="Leads & demos"
        description="Demo requests and website inquiries from the public marketing site."
      />

      <FilterBar>
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="lead-search">Search</Label>
          <Input
            id="lead-search"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setParams({ page: "1" });
            }}
            placeholder="Name, email, company, reference"
          />
        </div>
        <div>
          <Label htmlFor="lead-type">Type</Label>
          <Select
            id="lead-type"
            value={params.type}
            onChange={(event) => setParams({ type: event.target.value, page: "1" })}
          >
            <option value="">All</option>
            <option value="demo">Demo</option>
            <option value="inquiry">Inquiry</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="lead-status">Status</Label>
          <Select
            id="lead-status"
            value={params.status}
            onChange={(event) => setParams({ status: event.target.value, page: "1" })}
          >
            <option value="">All</option>
            {[...new Set([...DEMO_STATUSES, ...INQUIRY_STATUSES])].map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="lead-from">From</Label>
          <Input
            id="lead-from"
            type="date"
            value={params.startDate}
            onChange={(event) => setParams({ startDate: event.target.value, page: "1" })}
          />
        </div>
        <div>
          <Label htmlFor="lead-to">To</Label>
          <Input
            id="lead-to"
            type="date"
            value={params.endDate}
            onChange={(event) => setParams({ endDate: event.target.value, page: "1" })}
          />
        </div>
      </FilterBar>

      {listQuery.error ? (
        <ErrorState message={listQuery.error.message} onRetry={listQuery.refetch} />
      ) : (
        <DataTable
          loading={listQuery.isLoading}
          rows={listQuery.data?.leads || []}
          page={Number(params.page) || 1}
          limit={Number(params.limit) || 20}
          total={listQuery.data?.total || 0}
          onPageChange={(page) => setParams({ page: String(page) })}
          onRowClick={(row) => {
            setSelectedId(row.id);
            setStatusDraft(row.status);
          }}
          columns={[
            { key: "referenceId", header: "Reference", className: "font-medium" },
            { key: "type", header: "Type", cell: (row) => titleCase(row.type) },
            { key: "fullName", header: "Name" },
            { key: "companyName", header: "Company", cell: (row) => row.companyName || "—" },
            { key: "email", header: "Email" },
            { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
            { key: "createdAt", header: "Created", cell: (row) => formatDateTime(row.createdAt) },
          ]}
          emptyTitle="No leads yet"
          emptyDescription="Demo and inquiry submissions from the website will appear here."
        />
      )}

      <Sheet
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={lead ? `${titleCase(lead.type)} · ${lead.referenceId}` : "Lead detail"}
      >
        {detailQuery.isLoading ? <p className="text-sm text-muted">Loading…</p> : null}
        {detailQuery.error ? <p className="text-sm text-danger">{detailQuery.error.message}</p> : null}
        {lead ? (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-2">
              <div><dt className="text-muted">Name</dt><dd className="font-medium">{lead.fullName}</dd></div>
              <div><dt className="text-muted">Email</dt><dd>{lead.email}</dd></div>
              <div><dt className="text-muted">Phone</dt><dd>{lead.phone || "—"}</dd></div>
              <div><dt className="text-muted">Company</dt><dd>{lead.companyName || "—"}</dd></div>
              {lead.teamSize ? <div><dt className="text-muted">Team size</dt><dd>{lead.teamSize}</dd></div> : null}
              {lead.inquiryCategory ? (
                <div><dt className="text-muted">Category</dt><dd>{titleCase(lead.inquiryCategory)}</dd></div>
              ) : null}
              {lead.preferredDate ? (
                <div>
                  <dt className="text-muted">Preferred date</dt>
                  <dd>
                    {lead.preferredDate} {lead.preferredTimeWindow || ""} ({lead.timezone}) — request only
                  </dd>
                </div>
              ) : null}
              <div><dt className="text-muted">Message</dt><dd className="whitespace-pre-wrap">{lead.message || "—"}</dd></div>
              <div><dt className="text-muted">Source</dt><dd>{lead.sourcePage || "—"}</dd></div>
              <div><dt className="text-muted">Email notify</dt><dd>{lead.emailNotifyStatus}</dd></div>
            </dl>

            <PermissionGate permission="leads.update">
              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <Label htmlFor="lead-status-edit">Status</Label>
                  <Select id="lead-status-edit" value={statusDraft || lead.status} onChange={(e) => setStatusDraft(e.target.value)}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {titleCase(status)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lead-note">Internal note</Label>
                  <Textarea id="lead-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible only to admins" />
                </div>
                <Button
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      status: statusDraft || lead.status,
                      note: note.trim() || undefined,
                      reason: "Lead follow-up update",
                    })
                  }
                >
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
                {updateMutation.error ? <p className="text-danger">{updateMutation.error.message}</p> : null}
              </div>
            </PermissionGate>

            {lead.internalNotes?.length ? (
              <div className="border-t border-border pt-4">
                <p className="mb-2 font-medium">Internal notes</p>
                <ul className="space-y-2">
                  {lead.internalNotes.map((item, index) => (
                    <li key={`${item.createdAt}-${index}`} className="rounded-lg bg-slate-50 p-3">
                      <p className="whitespace-pre-wrap">{item.body}</p>
                      <p className="mt-1 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
