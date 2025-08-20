import { Badge } from "react-bootstrap";

function StatusBadge({ status, completed }) {
  const s = (status || "").toLowerCase();
  const isLive = s === "in_progress" || s === "live";
  const isFinal = completed || s === "final";

  if (isLive)  return <Badge bg="danger">Live</Badge>;
  if (isFinal) return <Badge bg="secondary">Final</Badge>;
  return null; // caller shows start time instead
}

export default StatusBadge;