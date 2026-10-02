interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
}

export default async function handler(_req: unknown, res: ApiResponse) {
  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL ?? null,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
  })
}
