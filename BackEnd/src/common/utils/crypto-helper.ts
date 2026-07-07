import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.JWT_SECRET || 'secretkey32charsneededforthisone!';
const KEY = crypto.createHash('sha256').update(SECRET).digest();

export function encrypt(text: string | null): string | null {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string | null): string | null {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText; // Retorna texto plano si no tiene formato cifrado (datos antiguos)
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // Fallback: intentar descifrar con la clave por defecto
      const fallbackSecret = 'secretkey32charsneededforthisone!';
      const fallbackKey = crypto
        .createHash('sha256')
        .update(fallbackSecret)
        .digest();
      const decipher = crypto.createDecipheriv(ALGORITHM, fallbackKey, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
  } catch {
    return encryptedText;
  }
}
