import { useRef, forwardRef, useImperativeHandle } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface RecaptchaComponentProps {
  onVerify: (token: string | null) => void;
  theme?: 'light' | 'dark';
}

export interface RecaptchaRef {
  reset: () => void;
  execute: () => void;
}

export const RecaptchaComponent = forwardRef<RecaptchaRef, RecaptchaComponentProps>(
  ({ onVerify, theme = 'light' }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef.current?.reset();
      },
      execute: () => {
        recaptchaRef.current?.execute();
      }
    }));

    // Para desenvolvimento, use uma chave de teste. Para produção, configure no admin settings
    const siteKey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Chave de teste do Google

    return (
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={onVerify}
          theme={theme}
          size="normal"
        />
      </div>
    );
  }
);

RecaptchaComponent.displayName = 'RecaptchaComponent';