export interface MailsterMetaData {
  _mailster_from_name: string;
  _mailster_from_email: string;
  _mailster_reply_to: string;
  _mailster_subject: string;
  _mailster_template: string;
  _mailster_lists: number[];
}

export interface MailsterCampaign {
  title: string;
  content: string;
  status: 'active' | 'queued' | 'paused' | 'autoresponder';
  meta_data: MailsterMetaData;
}

export interface MailsterSubscriber {
  email: string;
  firstname?: string;
  lastname?: string;
  list_ids: number[];
} 