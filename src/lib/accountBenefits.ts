/**
 * 회원 혜택(적립금·쿠폰) 단일 소스.
 * 서버 혜택 API가 아직 없어 보유 수량은 항상 0입니다.
 * 연결 지점: fetchAccountBenefits(userId)를 구현한 뒤 이 함수에서 호출하세요.
 */
export type AccountBenefits = {
  points: number;
  couponCount: number;
};

export const ACCOUNT_BENEFITS_API_CONNECTED = false;

export function getAccountBenefits(): AccountBenefits {
  return { points: 0, couponCount: 0 };
}
