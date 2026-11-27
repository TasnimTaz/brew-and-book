import TokenClient from './token-client';
export default async function BookingTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TokenClient token={token} />;
}
