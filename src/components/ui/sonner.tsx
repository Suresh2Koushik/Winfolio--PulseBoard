import { useLocation } from "react-router-dom";
import { Toaster as Sonner, toast } from "sonner";
import { useApplyTheme } from "@/lib/theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Toasts, plus the app's light/dark theme for the current page (must sit inside the router). */
const Toaster = ({ ...props }: ToasterProps) => {
  const { pathname } = useLocation();
  const dark = useApplyTheme(pathname);

  return (
    <Sonner
      theme={dark ? "dark" : "light"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
