import { Prisma, PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

// Reuse one client across hot reloads in development and across invocations
// of a warm serverless function in production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

type Context = { tx: Prisma.TransactionClient; actorId: string | null };
const context = new AsyncLocalStorage<Context>();
const tracked = new Set(["user", "familyMember", "trip", "tripRegistration", "paymentEvent", "expense", "tripTask", "tripIncident", "feedback", "feedbackForm", "feedbackResponse", "suggestion", "staffTrip", "dataRequest", "cancellation", "notification", "tripMessageDelivery", "birthdayDelivery"]);
const mutations = new Set(["create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany"]);

export function auditSnapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value, (key, item) => {
    if (/image|password|secret|token|phone|whatsapp|bloodGroup|emergencyContact|companions|description|comment|followUpNote|actionTaken|^note$|loved|leaderIdea|nextPlace|ratings|extras|ipHash|dedupeKey|^email$|^name$|vehicleDetails|carpoolLocation|recipient|birthday|receiptUrl|^text$/i.test(key)) return item === null ? null : "[redacted]";
    return item;
  }));
}

/** All application action writes share one transaction with their audit rows. */
export async function auditedTransaction<T>(actorId: string | null, action: () => Promise<T>): Promise<T> {
  if (context.getStore()) return action();
  // These callbacks only change database state and invalidate local caches;
  // delivery happens later, outside the transaction, so conflict retries are safe.
  for (let attempt = 0; ; attempt++) {
    try {
      return await basePrisma.$transaction((tx) => context.run({ tx, actorId }, action), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt >= 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 15 * (attempt + 1)));
    }
  }
}

// Preserve Prisma's public types while routing action queries through the active
// transaction. No request context means ordinary read/cron behaviour.
export const prisma: PrismaClient = new Proxy(basePrisma, {
  get(target, property) {
    const store = context.getStore();
    if (!store) { const value = Reflect.get(target, property); return typeof value === "function" ? value.bind(target) : value; }
    if (property === "$transaction") return (work: unknown) => typeof work === "function" ? work(prisma) : Promise.all(work as Promise<unknown>[]);
    const delegate = Reflect.get(store.tx, property);
    if (!tracked.has(String(property))) return typeof delegate === "function" ? delegate.bind(store.tx) : delegate;
    return new Proxy(delegate, { get(model, operation) {
      const fn = Reflect.get(model, operation);
      if (!mutations.has(String(operation))) return typeof fn === "function" ? fn.bind(model) : fn;
      return async (args: Record<string, unknown>) => {
        const op = String(operation);
        const before = args.where ? (op.endsWith("Many") ? await model.findMany({ where: args.where }) : await model.findUnique({ where: args.where })) : null;
        const result = await fn.call(model, args);
        if (op.endsWith("Many") && result.count === 0) return result;
        const candidateId = result?.id ?? (before && !Array.isArray(before) ? before.id : null);
        const id = typeof candidateId === "string" ? candidateId : null;
        const after = op.startsWith("delete") ? null : id ? await model.findUnique({ where: { id } }) : Array.isArray(before) ? await model.findMany({ where: { id: { in: before.map(row => row.id) } } }) : args.data ?? result;
        const anonymousCreate = String(property) === "feedbackResponse" && ["create", "upsert"].includes(op) && after?.anonymous;
        const input = op === "upsert" ? (before ? args.update : args.create) : args.data;
        const changedFields = input && !Array.isArray(input) ? Object.keys(input) : Array.isArray(input) ? [...new Set(input.flatMap(row => Object.keys(row)))] : [];
        await store.tx.activityLog.create({ data: { actorId: anonymousCreate ? null : store.actorId, entity: String(property), entityId: id, operation: op, changedFields, before: before === null ? Prisma.JsonNull : auditSnapshot(before), after: after === null ? Prisma.JsonNull : auditSnapshot(after) } });
        return result;
      };
    } });
  },
});
