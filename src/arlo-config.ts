export interface arloOptionsInterface {
  debug: boolean;

  arloUser: string;
  arloPassword: string;
  emailUser: string;
  emailPassword: string;
  emailServer: string;
  emailImapPort: number;
}

export type arloOptions = Readonly<arloOptionsInterface>;
