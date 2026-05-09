import { ApiResponse, ApiErrorCode } from "@/types/contracts";

export class FetchError extends Error {
  constructor(public code: ApiErrorCode | string, message: string) {
    super(message);
    this.name = "FetchError";
  }
}

/**
 * NINE API Contract에 맞춘 범용 fetcher
 * SWR과 연동하거나 단독으로 사용할 수 있습니다.
 */
export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  
  if (!res.ok) {
    // HTTP 에러가 발생했으나 envelope 포맷으로 내려오지 않은 경우에 대한 방어 로직
    let message = "서버 통신 중 오류가 발생했습니다.";
    let code = "SERVER_ERROR";
    
    try {
      const errorData = await res.json() as ApiResponse<any>;
      if (!errorData.ok) {
        message = errorData.error.message;
        code = errorData.error.code;
      }
    } catch (e) {
      // JSON 파싱 실패 시 기본 에러 유지
    }
    
    throw new FetchError(code, message);
  }

  const data = (await res.json()) as ApiResponse<T>;
  
  if (!data.ok) {
    throw new FetchError(data.error.code, data.error.message);
  }
  
  return data.data;
}

/**
 * POST 요청 등 페이로드가 있는 fetch를 위한 헬퍼
 */
export async function postFetcher<T, R>(url: string, body: T, options?: RequestInit): Promise<R> {
  return fetcher<R>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: JSON.stringify(body),
    ...options,
  });
}
