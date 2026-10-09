import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function SupportPage() {
  const { can } = useAdminAuth();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const load = () => adminApi.tickets("page=1").then(setData).catch((loadError) => setError(loadError.message));
  useEffect(() => { load(); }, []);
  return (
    <main className="content">
      <h1>Support</h1>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading tickets...</p> : null}
      {data && !data.tickets.length ? <p>No support tickets found.</p> : null}
      <div className="row">
        {(data?.tickets || []).map((ticket) => <button className="secondary" key={ticket.id} type="button" onClick={() => adminApi.ticket(ticket.id).then(setSelected)}>{ticket.ticketNumber} · {ticket.subject}</button>)}
      </div>
      {selected?.ticket ? <section className="panel">
        <h2>{selected.ticket.ticketNumber}</h2>
        <p>{selected.ticket.status} · {selected.ticket.priority}</p>
        {(selected.ticket.messages || []).map((message) => <p key={message._id}>{message.authorType}: {message.body}</p>)}
        {can("support.reply") ? <form onSubmit={async (event) => { event.preventDefault(); const next = await adminApi.reply(selected.ticket.id, { body: reply }); setSelected(next); setReply(""); }}>
          <textarea aria-label="Customer reply" value={reply} onChange={(event) => setReply(event.target.value)} />
          <button type="submit">Reply</button>
        </form> : null}
        {can("support.reply") ? <form onSubmit={async (event) => { event.preventDefault(); const next = await adminApi.note(selected.ticket.id, { body: note }); setSelected(next); setNote(""); }}>
          <textarea aria-label="Internal note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Internal note" />
          <button className="secondary" type="submit">Add internal note</button>
        </form> : null}
      </section> : null}
    </main>
  );
}
