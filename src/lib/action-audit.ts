import "server-only";
import { getCurrentUser } from "./session";
import { auditedTransaction } from "./prisma";

export async function withAudit<T>(action: () => Promise<T>): Promise<T> {
  const user = await getCurrentUser();
  return auditedTransaction(user?.id ?? null, action);
}

export async function withAnonymousAudit<T>(action: () => Promise<T>): Promise<T> {
  return auditedTransaction(null, action);
}
