export type Capability = "admin" | "finance" | "lead" | "moderate";
export function permits(role: string, staffRole: string | null | undefined, capability: Capability, assigned = false) {
  if (role === "ADMIN") return true;
  return capability === "finance" && staffRole === "FINANCE" || capability === "moderate" && staffRole === "MODERATOR" || capability === "lead" && staffRole === "LEADER" && assigned;
}
