import { useEffect, useRef } from 'react';

interface AirpayFormProps {
  url: string;
  params: {
    mid: string;
    data: string;
    privatekey: string;
    checksum: string;
  };
}

export function AirpayForm({ url, params }: AirpayFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, [url, params]);

  return (
    <form ref={formRef} action={url} method="post" style={{ display: 'none' }}>
      <input type="hidden" name="mid" value={params.mid} />
      <input type="hidden" name="data" value={params.data} />
      <input type="hidden" name="privatekey" value={params.privatekey} />
      <input type="hidden" name="checksum" value={params.checksum} />
    </form>
  );
}
