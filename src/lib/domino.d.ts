// @mixmark-io/domino's bundled declaration still names the module "domino", its
// old package name, so the scoped import needs this one.
declare module "@mixmark-io/domino" {
  export function createDocument(html?: string, force?: boolean): Document;
}
