export function urgencyColor(
  urgency: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (urgency) {
    case "emergency":
      return "destructive";
    case "urgent":
      return "outline";
    case "routine":
      return "secondary";
    default:
      return "outline";
  }
}
