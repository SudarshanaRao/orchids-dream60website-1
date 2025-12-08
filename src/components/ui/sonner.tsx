import { Toaster as Sonner } from "sonner";

const Toaster = () => {
  return (
    <Sonner
      position="top-right"
      expand={true}
      richColors
      closeButton
      className="toaster group"
    />
  );
};

export { Toaster, Toaster as Sonner };