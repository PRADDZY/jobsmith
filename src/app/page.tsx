import { Dashboard } from "./dashboard";
import { knowledgeBase, sampleRoleSignals, supportCases } from "@/lib/fixtures";

export default function Home() {
  return <Dashboard cases={supportCases} articles={knowledgeBase} sampleRoles={sampleRoleSignals} />;
}
