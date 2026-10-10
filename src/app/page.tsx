import { Dashboard } from "./dashboard";
import { sampleRoleSignals } from "@/lib/fixtures";

export default function Home() {
  return <Dashboard sampleRoles={sampleRoleSignals} />;
}
