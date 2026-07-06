import "server-only";
import bcrypt from "bcryptjs";

/**
 * 커머스 API 전자서명(client_secret_sign) 생성.
 *
 * 공식 문서(https://apicenter.commerce.naver.com/docs/auth)의 Node.js 예제와 동일한 절차입니다.
 *   1) password = `${clientId}_${timestamp}` (timestamp = 밀리초 Unix 시간)
 *   2) bcrypt.hashSync(password, clientSecret)  // clientSecret 이 salt 로 사용됨
 *   3) Base64 인코딩
 *
 * 주의: client_secret 은 반드시 bcrypt salt 형식($2a$.. 29자)이어야 합니다.
 *       Content-Type 은 application/x-www-form-urlencoded 로 전송해야 합니다.
 */
export function generateSignature(
  clientId: string,
  clientSecret: string,
  timestamp: number
): string {
  const password = `${clientId}_${timestamp}`;
  const hashed = bcrypt.hashSync(password, clientSecret);
  return Buffer.from(hashed, "utf-8").toString("base64");
}
