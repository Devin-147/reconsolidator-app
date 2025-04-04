
interface MailsterCustomFields {
  [key: string]: string | number | boolean;
}

interface MailsterSubscribeData {
  email: string;
  firstname?: string;
  lastname?: string;
  custom_fields?: MailsterCustomFields;
}

interface MailsterResponse {
  success: boolean;
  error?: string;
  msg?: string;
}

interface Mailster {
  subscribe: (data: MailsterSubscribeData, callback: (response: MailsterResponse) => void) => void;
}

interface Window {
  mailster?: Mailster;
}
