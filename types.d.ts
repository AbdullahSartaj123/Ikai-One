import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId?: string;
      memberRole?: string;
      platformRole?: string;
    courierPartnerId?: string;
    courierMemberRole?: string;
    } & NonNullable<DefaultSession["user"]>;
  }

  interface User {
    organizationId?: string;
    memberRole?: string;
    platformRole?: string;
    courierPartnerId?: string;
    courierMemberRole?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    memberRole?: string;
    platformRole?: string;
    courierPartnerId?: string;
    courierMemberRole?: string;
  }
}


declare module "jsbarcode" {
  type JsBarcodeOptions = Record<string, unknown>;
  const JsBarcode: (element: Element, value: string, options?: JsBarcodeOptions) => void;
  export default JsBarcode;
}
