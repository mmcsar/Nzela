/** Numéro support affiché sur Contact, Footer, homepage, factures, dashboard */
export const SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+243 995 547 081';

/** Pour href="tel:..." */
export function supportPhoneTel(phone = SUPPORT_PHONE): string {
  return phone.replace(/\s+/g, '');
}

/** Pour wa.me (chiffres uniquement, ex. 243995547081) */
export function supportPhoneWhatsApp(phone = SUPPORT_PHONE): string {
  return phone.replace(/\D/g, '');
}
