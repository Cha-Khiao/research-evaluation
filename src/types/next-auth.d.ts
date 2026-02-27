import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string; // เผื่อเอาไว้เช็คสิทธิ์อาจารย์/นักศึกษาในอนาคต
    };
  }
}