import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Serviciu de email real, provider-agnostic prin SMTP (nodemailer).
 * Setează `SMTP_HOST/PORT/USER/PASS/SECURE` pentru Resend / SES / orice SMTP.
 * În dev, dacă nu e configurat SMTP, folosește un cont Ethereal (inbox de test
 * cu URL de preview). Trimiterea e best-effort: nu aruncă erori către apelant.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private usingEthereal = false;
  private readonly frontendUrl: string;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    this.from = this.config.get<string>('MAIL_FROM', 'aplica <no-reply@aplica.md>');
  }

  async onModuleInit() {
    await this.initTransporter();
  }

  private async initTransporter() {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      const user = this.config.get<string>('SMTP_USER');
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT', 587)),
        secure: this.config.get('SMTP_SECURE', 'false') === 'true',
        auth: user ? { user, pass: this.config.get<string>('SMTP_PASS') } : undefined,
        // Timeout-uri scurte: email-ul e best-effort, nu trebuie să blocheze API-ul.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
      this.logger.log(`📮 SMTP configurat: ${host}`);
      return;
    }

    // Dev: cont Ethereal (email-uri de test vizibile prin URL de preview).
    try {
      const test = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: test.user, pass: test.pass },
      });
      this.usingEthereal = true;
      this.logger.warn('📮 SMTP nesetat — folosesc Ethereal (email-uri de test, nu ajung la destinatar real).');
    } catch (err) {
      this.logger.error('Nu am putut inițializa un transport de email; doar loghez link-urile.', err as Error);
    }
  }

  async sendEmailVerification(to: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    this.logger.log(`✉️  [verificare email] -> ${to}\n   ${url}`);
    await this.send(
      to,
      'Confirmă-ți adresa de email',
      this.template(
        'Confirmă adresa de email',
        'Bine ai venit pe aplica! Apasă butonul de mai jos ca să îți activezi contul. Linkul expiră în 24 de ore.',
        'Confirmă emailul',
        url,
      ),
    );
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    this.logger.log(`✉️  [resetare parolă] -> ${to}\n   ${url}`);
    await this.send(
      to,
      'Resetare parolă',
      this.template(
        'Resetează-ți parola',
        'Am primit o cerere de resetare a parolei. Apasă butonul de mai jos pentru a seta o parolă nouă. Dacă nu ai cerut tu, ignoră acest email. Linkul expiră într-o oră.',
        'Resetează parola',
        url,
      ),
    );
  }

  async sendNotificationEmail(
    to: string,
    title: string,
    body: string | null,
    link: string | null,
  ): Promise<void> {
    const url = link ? `${this.frontendUrl}${link}` : this.frontendUrl;
    await this.send(to, title, this.template(title, body ?? '', 'Deschide aplica', url));
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`(fără transport de email) către ${to}: ${subject}`);
      return;
    }
    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, html });
      if (this.usingEthereal) {
        this.logger.log(`📧 Preview email (${subject}): ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (err) {
      this.logger.error(`Trimiterea email către ${to} a eșuat (best-effort)`, err as Error);
    }
  }

  /** Șablon HTML simplu, branded, cu stiluri inline (compatibil clienți email). */
  private template(heading: string, message: string, ctaLabel: string, ctaUrl: string): string {
    return `
  <div style="background:#f5f7f5;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e9e5;">
      <div style="background:#001e00;padding:20px 28px;">
        <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;">aplica</span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#001e00;">${heading}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5e6d55;">${message}</p>
        <a href="${ctaUrl}" style="display:inline-block;background:#14a800;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:9999px;">${ctaLabel}</a>
        <p style="margin:24px 0 0;font-size:12px;color:#9aa39a;word-break:break-all;">Sau copiază linkul: ${ctaUrl}</p>
      </div>
      <div style="padding:16px 28px;border-top:1px solid #eef1ee;">
        <p style="margin:0;font-size:12px;color:#9aa39a;">© aplica — platforma de freelancing.</p>
      </div>
    </div>
  </div>`;
  }
}
