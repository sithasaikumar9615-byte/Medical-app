import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PATIENT" | "DOCTOR" | "PHARMACIST" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "PATIENT" | "DOCTOR" | "PHARMACIST" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PATIENT" | "DOCTOR" | "PHARMACIST" | "ADMIN";
  }
}
