import { useEffect, useRef } from 'react';

interface AirpayFormProps {
  url: string;
  params: {
    mercid: string;
    data: string;
    encdata?: string;
    privatekey: string;
    checksum: string;
    chmod?: string;
    customvar?: string;
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
      <input type="hidden" name="mercid" value={params.mercid} />
      <input type="hidden" name="data" value={params.data} />
      {params.encdata && <input type="hidden" name="encdata" value={params.encdata} />}
      <input type="hidden" name="privatekey" value={params.privatekey} />
      <input type="hidden" name="checksum" value={params.checksum} />
      <input type="hidden" name="chmod" value={params.chmod || ''} />
      <input type="hidden" name="customvar" value={params.customvar || ''} />
    </form>
  );
}
