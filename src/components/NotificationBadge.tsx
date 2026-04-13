export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-lg ring-2 ring-card animate-pulse">
      {count > 9 ? '9+' : count}
    </span>
  );
}
