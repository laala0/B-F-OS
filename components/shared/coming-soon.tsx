import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-neutral-600">
        <p>{description}</p>
        <p className="text-neutral-400">Ships in {phase}.</p>
      </CardContent>
    </Card>
  );
}
