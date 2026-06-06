'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
          {Icon && <Icon className="h-8 w-8 text-emerald-500" />}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
