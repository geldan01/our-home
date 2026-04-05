import { Role } from "@/generated/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};
