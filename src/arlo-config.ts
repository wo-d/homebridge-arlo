export interface arloOptionsInterface {
  arloPassword: string;
  arloUser: string;
  debug: boolean;
  emailImapPort: number;
  emailPassword: string;
  emailServer: string;
  emailUser: string;
}

export type arloOptions = Readonly<arloOptionsInterface>;
